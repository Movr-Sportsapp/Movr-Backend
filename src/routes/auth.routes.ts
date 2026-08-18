import { Router } from "express";
import {
  login,
  register,
  logout,
  refresh,
} from "../controllers/authController.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { authLimiter } from "../middleware/rateLimiter.ts";
import { validateBodyZod } from "../middleware/validateBodyZod.ts";
import { loginSchema, registerSchema } from "../schemas/auth.ts";

const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validateBodyZod(registerSchema),
  register,
);

authRouter.post("/login", authLimiter, validateBodyZod(loginSchema), login);

authRouter.post("/refresh", refresh);

authRouter.delete("/logout", logout);

// authRouter.get("/me", authenticate, me);

export default authRouter;
