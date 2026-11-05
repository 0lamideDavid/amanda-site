import { Router } from "express";

export const publicRouter = Router();

// Placeholder landing page. The real one-page public site is a later
// milestone (see Docs/PUBLIC_WEBSITE_SPEC.md) and is intentionally not
// built yet.
publicRouter.get("/", (req, res) => {
  res.render("public/placeholder");
});
