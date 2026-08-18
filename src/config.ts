import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGO_URI: z.string(),
  SALT_ROUNDS: z.coerce.number().default(12),
  ACCESS_JWT_SECRET: z.string().min(64),
  REFRESH_TOKEN_TTL: z.coerce.number().default(30 * 24 * 60 * 60),
  CLIENT_BASE_URL: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().default(8080),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:\n",
    z.prettifyError(parsedEnv.error),
  );
  process.exit(1);
}

export const {
  ACCESS_JWT_SECRET,
  CLIENT_BASE_URL,
  MONGO_URI,
  REFRESH_TOKEN_TTL,
  SALT_ROUNDS,
  PORT,
} = parsedEnv.data;

export const isProduction = parsedEnv.data.NODE_ENV === "production";
