import { body, validationResult } from 'express-validator';
import * as UserService from '../../services/UserService.js';
import { AppError } from "../../utils/errorHandler.js";

// Helper function to check for errors
const checkError = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(400, errors.array()));
  }

  return next();
}

// Vailidation middlewares
const validationMiddleware = {
  nameValidation: [
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name is required, minimum 2 characters, maximum 50 characters.')
      .escape(),
    checkError,
  ],
  registerUserValidation: [
    body('email')
      .matches(/TP[0-9]{6}@mail.apu.edu.my/)
      .withMessage('Invalid email address')
      .escape(),
    body('password')
      .isLength({ min: 8, max: 25 })
      .withMessage('Password is required, minimum 8 characters, maximum 25 characters.')
      .escape(),
    checkError
  ],
  loginUserValidation: [
    body('email')
      .matches(/TP[0-9]{6}@mail.apu.edu.my/)
      .withMessage('Invalid email address')
      .escape(),
    body('password')
      .isLength({ min: 8, max: 25 })
      .withMessage('Password is required, minimum 8 characters, maximum 25 characters.')
      .escape(),
    checkError
  ],
  emailValidation: [
    body('email')
      .matches(/TP[0-9]{6}@mail.apu.edu.my/)
      .withMessage('Invalid email address')
      .escape(),
    checkError
  ],
  codeValidation: [
    body('code')
      .isUUID(4)
      .withMessage('Invalid code')
      .escape(),
    checkError
  ],
  dobValidation: [
    body('dob')
      .isDate()
      .withMessage('Invalid date of birth')
      .escape(),
    checkError
  ],
  bioValidation: [
    body('bio')
      .isLength({ min: 25, max: 250 })
      .withMessage('Invalid bio')
      .escape(),
    checkError
  ],
  genderValidation: [
    body('gender')
      .matches(/(1|2)/)
      .withMessage('Invalid gender')
      .escape(),
    checkError
  ],
  orientationValidation: [
    body('orientation')
      .matches(/(1|2)/)
      .withMessage('Invalid orientation')
      .escape(),
    checkError
  ],
  resetPasswordValidation: [
    body('password')
      .isLength({ min: 8, max: 25 })
      .withMessage('Password is required, minimum 8 characters, maximum 25 characters.')
      .escape(),
    checkError
  ],
  addProfilePictureValidation:[
    body('picNum')
      .isInt({ min: 0, max: 5 })
      .withMessage('Invalid picture number')
      .escape(),
      checkError
  ]
  // Add other validations here
};

export default validationMiddleware;
