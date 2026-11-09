import type { Request, Response } from "express";
import { findActiveServices } from "../repositories/service.repository";
import { BUSINESS_CONTACT } from "../config/business";

// Display-only tags for the services/pricing cards, taken from the real
// notes already present in the approved HTML mockup's pricing table (not
// invented). Keyed by service name; a service without an entry just shows
// no tags rather than a guess.
const SERVICE_TAGS: Record<string, string[]> = {
  "Regular home cleaning": ["2-hour minimum", "Supplies included"],
  "Errands & concierge": ["1-hour minimum", "Fuel included locally"],
  "Holiday-let turnover": ["Small to medium property", "Larger homes quoted"],
  "End-of-tenancy / deep clean": ["Fixed price after photos or a quick visit"],
  "Small commercial cleaning": ["Regular weekly contract"],
};

// Keyed by service name so each service always gets an image that matches
// what it actually is, rather than cycling through a fixed-size array (which
// previously gave "Errands & concierge" a photo of someone cleaning an
// office monitor just because of where it fell in alphabetical order).
const SERVICE_IMAGES: Record<string, string> = {
  "Regular home cleaning": "/images/service-home.png",
  "Errands & concierge": "/images/service-errands.jpg",
  "Holiday-let turnover": "/images/service-turnover.jpg",
  "End-of-tenancy / deep clean": "/images/service-deep-clean.png",
  "Small commercial cleaning": "/images/service-commercial.png",
};
const DEFAULT_SERVICE_IMAGE = "/images/service-home.png";

export async function showHome(req: Request, res: Response) {
  const services = await findActiveServices();
  const servicesForView = services.map((s) => ({
    ...s,
    tags: SERVICE_TAGS[s.name] ?? [],
    image: SERVICE_IMAGES[s.name] ?? DEFAULT_SERVICE_IMAGE,
  }));

  res.render("public/index", {
    services: servicesForView,
    contact: BUSINESS_CONTACT,
    servicesJson: JSON.stringify(
      services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        pricingUnit: s.pricingUnit,
        basePrice: s.basePrice !== null ? Number(s.basePrice) : null,
        minimum: s.minimum !== null ? Number(s.minimum) : null,
      })),
    ),
  });
}
