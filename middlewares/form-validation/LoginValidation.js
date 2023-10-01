import { body } from 'express-validator';

export const loginUserValidation = [
    body('email')
        .matches(/TP[0-9]{6}@mail.apu.edu.my/)
        .withMessage('Invalid email address')
        .escape(),
    body('password')
        .isLength({ min: 8, max: 15 })
        .withMessage('Invalid password')
        .bail()
        .escape(),
];