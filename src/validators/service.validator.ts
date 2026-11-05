import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pricingUnit: z.enum(["hourly", "flat", "from", "quote"]),
  basePrice: z.coerce.number().nonnegative().optional(),
  minimum: z.coerce.number().positive().optional(),
  // A plain boolean, not z.coerce.boolean(): an unchecked HTML checkbox
  // omits the field entirely rather than sending "false", so the caller
  // must turn that into a real boolean (e.g. `req.body.active === "on"`)
  // before this schema sees it.
  active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
