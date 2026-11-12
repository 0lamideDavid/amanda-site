import path from "node:path";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { sessionMiddleware } from "./config/session";
import { publicRouter } from "./routes/public.routes";
import { authRouter } from "./routes/auth.routes";
import { adminRouter } from "./routes/admin.routes";
import { formatLocalDate, formatLocalTime, formatLocalDateTime } from "./utils/dateRange";
import { BUSINESS_CONTACT } from "./config/business";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

export const app = express();

// Required behind Vercel's reverse proxy:
// 1. Secure cookies work correctly (app can detect HTTPS)
// 2. Rate limiter keys off real client IP, not the proxy's IP
app.set("trust proxy", 1);

app.set("view engine", "ejs");
// Check process.cwd() (where Vercel Serverless locates included files) and __dirname
app.set("views", [
  path.join(process.cwd(), "src", "views"),
  path.join(process.cwd(), "dist", "views"),
  path.join(__dirname, "views"),
  path.join(__dirname, "../src/views"),
]);

// Fixed once per process, not per request: available to every view (public
// and admin) automatically via Express's app.locals, so CSS/JS asset URLs
// can bust the browser's cache on each restart without every controller
// needing to pass it explicitly.
app.locals.assetVersion = Date.now();

// Available to every view as plain functions, so templates never need to
// call the UTC-converting date.toISOString().slice(...) pattern directly.
app.locals.formatLocalDate = formatLocalDate;
app.locals.formatLocalTime = formatLocalTime;
app.locals.formatLocalDateTime = formatLocalDateTime;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "src", "public")));
app.use(express.static(path.join(process.cwd(), "dist", "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleware);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/debug", (req, res) => {
  const fs = require("node:fs");
  const candidateDirs = [
    path.join(process.cwd(), "src", "views"),
    path.join(process.cwd(), "views"),
    path.join(process.cwd(), "dist", "views"),
    path.join(__dirname, "views"),
    path.join(__dirname, "../src/views"),
    path.join(__dirname, "../views"),
  ];
  const candidates = candidateDirs.map((d: string) => ({
    dir: d,
    exists: fs.existsSync(d),
    files: fs.existsSync(d) ? fs.readdirSync(d) : [],
  }));
  res.json({
    cwd: process.cwd(),
    __dirname,
    viewsSetting: app.get("views"),
    filesInCwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : [],
    candidates,
    envDatabaseUrl: !!process.env.DATABASE_URL,
  });
});

app.get("/debug-home", (req, res) => {
  res.render("public/index", {
    services: [
      {
        id: "1",
        name: "Regular home cleaning",
        description: null,
        pricingUnit: "hourly",
        basePrice: 18,
        minimum: 2,
        active: true,
        tags: ["2-hour minimum", "Supplies included"],
        image: "/images/service-home.png",
      },
    ],
    contact: BUSINESS_CONTACT,
    servicesJson: "[]",
  });
});

app.use(authRouter);
app.use("/admin", adminRouter);
app.use("/", publicRouter);

// Catches anything forwarded via next(err) by asyncHandler — logs server-side
// and returns error details to assist in production debugging.
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || String(err),
    stack: err?.stack,
  });
};
app.use(errorHandler);
