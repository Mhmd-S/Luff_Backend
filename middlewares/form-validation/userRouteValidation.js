import { body, check, validationResult } from 'express-validator';
import * as UserService from '../../services/UserService.js';
import { checkError } from '../utils.js';
import { verifyPassword } from '../utils.js';

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
      .escape()
      .custom(async(value) => {
        const isRegistered = await UserService.checkEmailRegistered(value);
        if (isRegistered) {
          return 'Email is already registered'
        }
        return true;
        }
    ),
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
      .isLength({ min: 6, max: 6 })
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
      .isLength({ min: 25, max: 500 })
      .withMessage('Invalid bio')
      .escape(),
    checkError
  ],

  genderValidation: [
    body('gender')
      .matches(/(male|female)/)
      .withMessage('Invalid gender')
      .escape(),
    checkError
  ],

  resetPasswordValidation: [
    body('password')
      .isLength({ min: 8, max: 25 })
      .withMessage('Password is required, minimum 8 characters, maximum 25 characters.')
      .escape(),
    checkError
  ]

  // Add other validations here
};

export default validationMiddleware;
