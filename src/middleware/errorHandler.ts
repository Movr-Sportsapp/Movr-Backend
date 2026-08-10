import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.ts";
import { isProduction } from "../config.ts";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  //1. validations errors from Zod
  if (err instanceof ZodError) {
    const formattedError = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: formattedError,
    });
  }

  //2. this is the safety net for the register race condition
  if (err?.code === 11000) {
    return res.status(409).json({
      status: "error",
      message: "Email already in use",
    });
  }

  //3. Errors we throw on purpose
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  //4. Everything else is unexpected. Log the real thing for ourselves, but show a generic message to the client
  console.error("Unexpected error: ", err);
  res.status(500).json({
    status: "error",
    message: isProduction
      ? "Internal server error"
      : err?.message || "Internal server error",
  });
};
