import { z } from "zod/v4";
import { Schema } from "mongoose";

const eventSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150),
  description: z.string().trim().max(1000).optional(),
  sport: z.string(),
  location: z.object({
    city: z.string().trim().min(1, "City is required"),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format"),
  skillLevel: z
    .enum(["Beginner", "Intermediate", "Advanced", "Professional"])
    .optional(),
  maxParticipants: z.number().min(2),
  participants: z
    .array(
      z.object({
        userId: z.string(),
        joinedAt: z.coerce.date(),
      }),
    )
    .optional(),
  status: z.enum(["active", "cancelled", "completed"]).optional(),
  isPublic: z.boolean().optional(),
  womenOnly: z.boolean().optional(),
  flintaOnly: z.boolean().optional(),
});

export { eventSchema };
