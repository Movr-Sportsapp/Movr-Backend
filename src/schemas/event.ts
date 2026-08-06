import { z } from "zod/v4";

const eventSchema = z.strictObject({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(150),
    descripition: z
      .string()
      .trim()
      .max(1000)
      .optional(),
    sports: z.object({sportId: z.string()}),
    creator: z.object({userId: z.string()}),
    location: z
      .array(
        z.object({
            city: z.string().trim(), 
            coordinates:
                z.object({
                    latitude: z.number(),
                    longitude: z.number()
                })
                .optional()
            })
        ),
    date: z.coerce.date(),
    skillLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Professional"]).optional(),
    maxParticipants: z
    .number()
    .min(2),
    participants: z
      .array(
      z.object({
        userId: z.string(),
        joinedAt: z.coerce.date()
    }))
    .optional(),
    status: z
    .enum(["active", "cancelled", "completed"])
    .optional()
});

export { eventSchema };