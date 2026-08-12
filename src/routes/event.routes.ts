import { Router } from "express";
import { authenticate, authorize } from "../middleware/authenticate.ts";
import { validateBodyZod } from "../middleware/validateBodyZod.ts";
import { eventSchema } from "../schemas/event.ts";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../controllers/eventController.ts";

const eventRouter = Router();
eventRouter.get("/", getEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/", authenticate, validateBodyZod(eventSchema), createEvent);
eventRouter.patch("/:eventId", authenticate, updateEvent);
eventRouter.delete("/:id", authenticate, deleteEvent);
export default eventRouter;
