import express from 'express';
import * as RegistrationController from '../controllers/RegistrationController';
import validationMiddleware from '../middlewares/form-validation/userRouteValidation.js';

let router = express.Router();

router.post('/verify-email', validationMiddleware.emailValidation, RegistrationController.verifyEmail);

router.post('/verify-code', validationMiddleware.codeValidation, RegistrationController.checkRegistrationCode);

router.post('/register', validationMiddleware.registerUserValidation, RegistrationController.registerUser);

export default router;