import path from "node:path";
import express from "express";
import { sessionMiddleware } from "./config/session";
import { publicRouter } from "./routes/public.routes";
import { authRouter } from "./routes/auth.routes";
import { adminRouter } from "./routes/admin.routes";

export const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleware);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(authRouter);
app.use("/admin", adminRouter);
app.use("/", publicRouter);
