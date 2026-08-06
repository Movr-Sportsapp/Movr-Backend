import { Schema, model } from "mongoose";

const sportSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Sport name is required"],
      unique: true,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Indoor", "Outdoor"],
    },

    icon: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

sportSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, converted) => {
    delete (converted as Partial<typeof converted>)._id;
  },
});

export default model("Sport", sportSchema);
