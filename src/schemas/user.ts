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
    .max(20)
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, underscores, and periods",
    ),
  email: z.email("invalid email").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  profileImage: z.string().optional(),
  gender: z.enum(["male", "female", "non-binary", "other"]),
  bio: z.string().max(500).optional(),
  dateOfBirth: z.coerce
    .date()
    .max(new Date(), "Date of birth cannot be in the future")
    .refine((date) => {
      const age =
        (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 18; // or whatever your minimum is
    }, "Must be at least 18 years old"),
  location: z.object({
    city: z.string().trim().min(1, "City is required"),
    country: z.string().trim().min(1, "Country is required"),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
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
    .max(20)
    .refine(
      (arr) => new Set(arr.map((s) => s.sportId)).size === arr.length,
      "Duplicate sport entries are not allowed",
    )
    .optional(),
});

export { userSchema };
