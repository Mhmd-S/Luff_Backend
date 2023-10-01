// Form Validation. Can be used for the login and register part of the application.

import { body, validationResult } from 'express-validator';
import AppError from './AppError';

const validateLogin = [
    body('email')
        .matches(/TP[0-9]{6}@mail.apu.edu.my/)
        .withMessage('Invalid email address')
        .escape(),
    body('password')
        .isLength({ min: 8, max: 15 })
        .withMessage('Invalid password')
        .bail()
        .escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return next(new AppError(400, errors.array()));
        }

        next(); // Move to the next middleware if validation succeeds
    }
];

module.exports = { validateLogin };
