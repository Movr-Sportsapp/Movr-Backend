import type { Request, Response } from "express";
import User from "../models/User.ts";
import type { userSchema } from "#schemas/user.ts";
import z from "zod";
import mongoose from "mongoose";

type userBody = z.infer<typeof userSchema>;

// GET /users/me — full profile, only the owner can see this
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        gender: user.gender,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        sports: user.sports,
        role: user.roles,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

// GET /users/:username — public profile, visible to anyone
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        location: {
          city: user.location?.city,
          country: user.location?.country,
        },
        sports: user.sports,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const {
      firstName,
      lastName,
      username,
      email,
      profileImage,
      gender,
      bio,
      dateOfBirth,
      location,
      sports,
    } = body as userBody;

    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: "user not found" });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (gender !== undefined) user.gender = gender;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (location !== undefined) user.location = location;
    if (sports !== undefined) {
      user.sports = sports.map((s) => ({
        sportId: new mongoose.Types.ObjectId(s.sportId),
        skillLevel: s.skillLevel,
      })) as typeof user.sports;
    }
    await user.save();
    res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        gender: user.gender,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        sports: user.sports,
        role: user.roles,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

// DELETE /users/me — delete own account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.user?.userId);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    res.status(204).json({ message: "Account deleted" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
