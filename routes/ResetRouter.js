import express from 'express';
import * as ResetController from '../controllers/ResetController.js';
import validationMiddleware from '../middlewares/form-validation/userRouteValidation.js';

let router = express.Router();

router.post('/request-reset-password', validationMiddleware.emailValidation, ResetController.requestResetPassword);

router.post('/reset-password', validationMiddleware.resetPasswordValidation, ResetController.resetPassword);

export default router;