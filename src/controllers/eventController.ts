import { Event, Sport } from "../models/index.ts";
import { type RequestHandler } from "express";
import { eventSchema } from "../schemas/event.ts";
import z from "zod";
import mongoose from "mongoose";

type eventInput = z.infer<typeof eventSchema>;

export const getEvents: RequestHandler = async (req, res) => {
  try {
    const {
      sport,
      city,
      skillLevel,
      date,
      status,
      latitude,
      longitude,
      radius,
    } = req.query;

    const filter: Record<string, unknown> = {};
    // console.log(req.user);
    // // Not logged in → only public events
    // if (!req.user) {
    //   filter.isPublic = true;
    // }

    if (sport) {
      if (!mongoose.Types.ObjectId.isValid(sport as string)) {
        return res.status(400).json({
          message: "Invalid sport ID",
        });
      }

      filter.sport = sport;
    }

    if (city) {
      filter["location.city"] = {
        $regex: city as string,
        $options: "i",
      };
    }

    if (skillLevel) {
      filter.skillLevel = skillLevel;
    }

    if (status) {
      filter.status = status;
    } else {
      // By default, only show active events
      filter.status = "active";
    }

    // Search by specific date
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }
    if (latitude && longitude) {
      filter["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const events = await Event.find(filter)
      .populate("sport", "name category icon")
      .populate("creator", "firstName lastName username profileImage")
      .populate("participants.user", "firstName lastName username profileImage")
      .sort({ date: 1 });

    return res.status(200).json({
      status: "success",
      count: events.length,
      data: events,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getEventById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate("sport", "name category icon")
      .populate("creator", "firstName lastName username profileImage")
      .populate(
        "participants.user",
        "firstName lastName username profileImage",
      );

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: event,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const createEvent: RequestHandler = async (req, res) => {
  try {
    //const validatedData = eventSchema.parse(req.body);

    const {
      title,
      description,
      sport,
      location,
      date,
      time,
      skillLevel,
      maxParticipants,
      isPublic,
      womenOnly,
      flintaOnly,
    } = req.body as eventInput;

    // Creator comes from authenticated user
    const creatorId = req.user?.userId;

    if (!creatorId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Make sure the event date is in the future
    if (new Date(date) <= new Date()) {
      return res.status(400).json({
        message: "Event date must be in the future",
      });
    }
    const event = await Event.create({
      title,
      description,
      sport,
      creator: creatorId,
      location,
      date,
      time,
      skillLevel,
      maxParticipants,
      isPublic,
      womenOnly,
      flintaOnly,

      // Creator automatically joins the event
      participants: [
        {
          user: creatorId,
        },
      ],
    });

    return res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const updateEvent: RequestHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    // Only the creator can update the event
    if (event.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to update this event",
      });
    }

    // Don't allow updates to cancelled/completed events
    if (event.status !== "active") {
      return res.status(400).json({
        status: "error",
        message: "Only active events can be updated",
      });
    }

    const validatedData = eventSchema.partial().parse(req.body);

    // Don't allow the client to update these fields
    delete (validatedData as any).creator;
    delete (validatedData as any).participants;

    const updatedEvent = await Event.findByIdAndUpdate(eventId, validatedData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      status: "success",
      data: updatedEvent,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    // Only creator can delete the event
    if (event.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to delete this event",
      });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      status: "success",
      message: "Event deleted successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
