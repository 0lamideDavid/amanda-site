import type { Request, Response } from "express";
import { findActiveServices } from "../repositories/service.repository";

// Contact details shown in the footer/nav. Not a pricing or business rule
// the spec asks to be database-driven, so a small constant here (unlike
// Service pricing, which must stay in the database).
export const BUSINESS_CONTACT = {
  brand: "Amanda's",
  tagline: "Smart Cleaning, Swift Errand",
  email: "hello@amandas.example",
  phone: "07000 000000",
  whatsapp: "447000000000",
  area: "Plymouth, Devon",
};

// Display-only tags for the services/pricing cards, taken from the real
// notes already present in the approved HTML mockup's pricing table (not
// invented). Keyed by service name; a service without an entry just shows
// no tags rather than a guess.
const SERVICE_TAGS: Record<string, string[]> = {
  "Regular home cleaning": ["2-hour minimum", "Supplies included"],
  "Errands & concierge": ["1-hour minimum", "Fuel included locally"],
  "Holiday-let turnover": ["Photo report included", "Key-holding available"],
  "End-of-tenancy / deep clean": ["Fixed price after photos", "Carpets steam-cleaned"],
  "Small commercial cleaning": ["Quoted after site visit", "Weekly contract"],
};

const SERVICE_IMAGES = ["/images/service-1.png", "/images/service-2.png", "/images/service-3.png"];

export async function showHome(req: Request, res: Response) {
  const services = await findActiveServices();
  const servicesForView = services.map((s, i) => ({
    ...s,
    tags: SERVICE_TAGS[s.name] ?? [],
    image: SERVICE_IMAGES[i % SERVICE_IMAGES.length],
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
