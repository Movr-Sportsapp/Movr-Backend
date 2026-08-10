import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "firstname is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "lastname is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
      match: [
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscores, and periods",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email is not valid"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "other"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: (v: Date) => v < new Date(),
        message: "Date of birth cannot be in the future",
      },
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },

    location: {
      city: {
        type: String,
        required: true,
      },

      country: {
        type: String,
        required: true,
      },

      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
      },
    },

    sports: [
      {
        sportId: {
          type: Schema.Types.ObjectId,
          ref: "Sport",
        },

        skillLevel: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Professional"],
          default: "Beginner",
        },
      },
    ],
    roles: {
      type: [String],
      default: ["user"],
    },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, converted) => {
    delete (converted as Partial<typeof converted>)._id;
    delete (converted as Partial<typeof converted>).passwordHash;
  },
});
export default model("User", userSchema);
