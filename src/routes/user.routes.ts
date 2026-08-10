import { Router } from "express";
import { authenticate } from "../middleware/authenticate.ts";
import {
  deleteAccount,
  getProfile,
  getPublicProfile,
  updateUser,
} from "../controllers/userController.ts";

const userRouter = Router();
userRouter.get("/me", authenticate, getProfile);
userRouter.get("/:username", getPublicProfile);
userRouter.post("/me", authenticate, updateUser);
userRouter.delete("/me", authenticate, deleteAccount);
export default userRouter;
