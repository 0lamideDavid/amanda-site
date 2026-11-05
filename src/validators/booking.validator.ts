import { z } from "zod";

export const createBookingRequestSchema = z.object({
  serviceId: z.string().uuid(),
  requestedDate: z.coerce.date(),
  requestedTime: z.string().trim().min(1),
  frequency: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().positive().optional(),
  address: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  instructions: z.string().trim().min(1).optional(),
  customer: z.object({
    name: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    email: z.string().trim().toLowerCase().email().optional(),
  }),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;

export const confirmBookingSchema = z
  .object({
    scheduledStartAt: z.coerce.date(),
    scheduledEndAt: z.coerce.date(),
    priceSnapshot: z.coerce.number().nonnegative().optional(),
  })
  .refine((data) => data.scheduledEndAt > data.scheduledStartAt, {
    message: "scheduledEndAt must be after scheduledStartAt",
    path: ["scheduledEndAt"],
  });

export const rescheduleBookingSchema = z
  .object({
    scheduledStartAt: z.coerce.date(),
    scheduledEndAt: z.coerce.date(),
  })
  .refine((data) => data.scheduledEndAt > data.scheduledStartAt, {
    message: "scheduledEndAt must be after scheduledStartAt",
    path: ["scheduledEndAt"],
  });
