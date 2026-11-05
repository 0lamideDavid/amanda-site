import { Prisma } from "@prisma/client";
import type { Service } from "@prisma/client";

// Mirrors the estimate rules in Docs/BOOKING_SYSTEM_SPEC.md: hourly services
// bill for the greater of the requested quantity or the service minimum;
// flat services bill per unit; "from"/"quote" services have no snapshot
// until an admin sets one on confirmation.
export function computePriceSnapshot(service: Service, quantity?: number): Prisma.Decimal | null {
  if (service.basePrice === null) return null;

  if (service.pricingUnit === "hourly") {
    const minimum = service.minimum ? Number(service.minimum) : 1;
    const hours = Math.max(quantity ?? minimum, minimum);
    return new Prisma.Decimal(service.basePrice).mul(hours);
  }

  if (service.pricingUnit === "flat") {
    const units = quantity ?? 1;
    return new Prisma.Decimal(service.basePrice).mul(units);
  }

  return null;
}
