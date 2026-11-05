import { z } from "zod";

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
});
