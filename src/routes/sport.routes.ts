// routes/sportRoutes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.ts";
import { validateBodyZod } from "../middleware/validateBodyZod.ts";
import { sportSchema } from "../schemas/sport.ts";
import {
  getSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport,
} from "../controllers/sportsController.ts";

const sportsRouter = Router();

sportsRouter.get("/", getSports);
sportsRouter.get("/:id", getSportById);

sportsRouter.post("/", authenticate, validateBodyZod(sportSchema), createSport);
sportsRouter.put(
  "/:id",
  authenticate,
  validateBodyZod(sportSchema),
  updateSport,
);
sportsRouter.delete("/:id", authenticate, deleteSport);

export default sportsRouter;
