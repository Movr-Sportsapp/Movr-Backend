import type { RequestHandler } from "express";
import Sport from "../models/Sport.ts";

export const getSports: RequestHandler = async (req, res) => {
  try {
    const sports = await Sport.find().sort({ name: 1 });
    res.status(200).json({ status: "success", data: sports });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getSportById: RequestHandler = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) return res.status(404).json({ error: "sport not found" });
    res.status(200).json({ status: "success", data: sport });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const createSport: RequestHandler = async (req, res) => {
  try {
    const { name, category, icon } = req.body;

    const existing = await Sport.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: "sport already exists" });
    }

    const sport = await Sport.create({ name, category, icon });
    res.status(201).json({ status: "success", data: sport });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const updateSport: RequestHandler = async (req, res) => {
  try {
    const { name, category, icon } = req.body;

    const sport = await Sport.findById(req.params.id);
    if (!sport) return res.status(404).json({ error: "sport not found" });

    if (name !== undefined) sport.name = name;
    if (category !== undefined) sport.category = category;
    if (icon !== undefined) sport.icon = icon;

    await sport.save();
    res.status(200).json({ status: "success", data: sport });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const deleteSport: RequestHandler = async (req, res) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ error: "sport not found" });
    res.status(204).json({ message: "Sport deleted" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
