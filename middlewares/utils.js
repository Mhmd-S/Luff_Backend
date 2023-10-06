import { AppError } from "../utils/errorHandler.js";
import { validationResult } from 'express-validator';

export const checkError = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(400, errors.array()));
  }

  return next();
}