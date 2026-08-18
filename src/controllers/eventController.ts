import { Event, Sport } from "../models/index.ts";
import { type RequestHandler } from "express";
import { eventSchema } from "../schemas/event.ts";
import z from "zod";
import mongoose from "mongoose";

type eventInput = z.infer<typeof eventSchema>;

//Haversine helper function
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getEvents: RequestHandler = async (req, res) => {
  try {
    const {
      sport,
      city,
      skillLevel,
      date,
      status,
      lat,
      lng,
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
    
    let events = await Event.find(filter)
      .populate("sport", "name category icon")
      .populate("creator", "firstName lastName username profileImage")
      .populate("participants.user", "firstName lastName username profileImage")
      .sort({ date: 1 });
    
    if (lat && lng && radius) {
      events = events.filter((event) => {
        const coords = event.location?.coordinates;
        if (!coords?.latitude || !coords?.longitude ) return false;

      const distance = getDistanceKm(
        Number(lat),
        Number(lng),
        coords.latitude,
        coords.longitude,
      );
      return distance <= Number(radius);
      });
    }

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

export const joinEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const event = await Event.findById(id)
      .populate("sport", "name category icon")
      .populate("creator", "firstName lastName username profileImage")
      .populate(
        "participants.user",
        "firstName lastName username profileImage",
      );
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "active") {
      return res
        .status(400)
        .json({ message: "This event is not open for joining" });
    }

    const alreadyJoined = event.participants.some(
      (p) => p.user?.toString() === userId,
    );
    if (alreadyJoined) {
      return res.status(409).json({ message: "You already joined this event" });
    }
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" });
    }

    event.participants.push({ user: userId, joinedAt: new Date() });
    await event.save();

    const populated = await event.populate(
      "participants.user",
      "username profileImage",
    );
    res.json({ data: populated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const leaveEvent: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const wasJoined = event.participants.some(
      (p) => p.user?.toString() === userId,
    );
    if (!wasJoined) {
      return res
        .status(409)
        .json({ message: "You are not part of this event" });
    }

    if (event.creator.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Host cannot leave their own event" });
    }

    await Event.updateOne(
      { _id: id },
      { $pull: { participants: { user: userId } } },
    );

    const updated = await Event.findById(id).populate([
      { path: "participants.user", select: "username profileImage" },
      { path: "sport" },
      { path: "creator", select: "firstName lastName username profileImage" },
    ]);

    res.status(200).json({ data: updated });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
