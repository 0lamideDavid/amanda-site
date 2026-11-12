import path from "node:path";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { sessionMiddleware } from "./config/session";
import { publicRouter } from "./routes/public.routes";
import { authRouter } from "./routes/auth.routes";
import { adminRouter } from "./routes/admin.routes";
import { formatLocalDate, formatLocalTime, formatLocalDateTime } from "./utils/dateRange";

export const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // src/views in dev; Vercel preserves structure

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
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleware);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(authRouter);
app.use("/admin", adminRouter);
app.use("/", publicRouter);

// Catches anything forwarded via next(err) by asyncHandler — never leaks
// error details to the client, just logs server-side and responds plainly.
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send("Something went wrong. Please try again.");
};
app.use(errorHandler);
