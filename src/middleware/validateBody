import type { ZodType } from "zod";
import type { Request, Response, NextFunction } from "express";

const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: result.error.issues });
    }

    req.body = result.data;
    next();
  };
};
export default validateBody;
