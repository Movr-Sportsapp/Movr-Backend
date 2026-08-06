import { z } from "zod/v4";

const userSchema = z.strictObject({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20),
  email: z.email("invalid email"),
  password: z.string().min(4, "password should be atleast 4 chars"),
  profileImage: z.string().optional(),
  gender: z.enum(["male", "female", "non-binary", "other"]).optional(),
  bio: z.string().max(500).optional(),
  dateOfBirth: z.coerce.date(),
  location: z.object({
    city: z.string().trim().min(1, "City is required"),
    country: z.string().trim().min(1, "Country is required"),
    coordinates: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
  }),
  sports: z
    .array(
      z.object({
        sportId: z.string(),
        skillLevel: z.enum([
          "Beginner",
          "Intermediate",
          "Advanced",
          "Professional",
        ]),
      }),
    )
    .optional(),
});

export { userSchema };
