import express from 'express';
// import UserController from '../controllers/UserController.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import * as UserControllers from '../controllers/UserController.js';

let router = express.Router();

router.post('/verify-email', UserControllers.verifyEmail);

export default router;