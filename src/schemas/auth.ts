import z from "zod";

// ===========================
// Reusable building blocks
// ===========================

const emailSchema = z.email({ error: "Please provide a valid email" });
const basePasswordSchema = z
  .string({ error: "Password must be a string" })
  .min(8, { error: "Password must be at least 8 chars" })
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

// ===========================
// Register schema
// ===========================
export const registerSchema = z
  .strictObject({
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
    password: basePasswordSchema,
    confirmPassword: z.string(),
    gender: z.enum(["male", "female", "non-binary", "other"]),
    dateOfBirth: z.coerce
      .date()
      .max(new Date(), "Date of birth cannot be in the future")
      .refine((date) => {
        const age =
          (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return age >= 18;
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
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ===========================
// Login schema
// ===========================
export const loginSchema = z
  .strictObject({
    identifier: z.string().min(3), // email or username
    password: z.string().min(8),
  })
  .strict();
