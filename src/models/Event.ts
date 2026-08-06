import { Schema, model } from "mongoose";

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    sport: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      city: {
        type: String,
        required: true,
      },

      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    date: {
      type: Date,
      required: true,
    },

    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Professional"],
      default: "Beginner",
    },

    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
    },

    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },

    public: {
      type: Boolean,
      default: false
    },

    womenOnly: {
      type: Boolean,
      default: false
    },

    flintaOnly: {
      type: Boolean,
      default: false
    },
    
  },
  {
    timestamps: true,
  },
);

eventSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, converted) => {
    delete (converted as Partial<typeof converted>)._id;
  },
});

export default model("Event", eventSchema);
