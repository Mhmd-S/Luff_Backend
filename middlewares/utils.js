import { AppError } from "../utils/errorHandler.js";
import { validationResult } from 'express-validator';
import bcrypt from  'bcryptjs';
import User from '../models/User.js';

export const checkError = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(400, errors.array()));
  }

  return next();
}

export const verifyPassword = async(password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const usersInfo = await User.getById(req.user._id).exec();

    if (usersInfo.password !== hashedPassword) {
        return 'Incorrect password';
    }
    return true;
}