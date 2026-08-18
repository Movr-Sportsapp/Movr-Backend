import { z } from "zod/v4";

const sportSchema = z.strictObject({
  name: z.string().trim().min(1, "name is required"),
  category: z.enum(["Indoor", "Outdoor"]),
  icon: z.string().trim().optional(),
});

export { sportSchema };
