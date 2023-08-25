import express from 'express';
// import UserController from '../controllers/UserController.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

let router = express.Router();

router.post('/verify-email', (req,res) => {
    const newUser = User({
        
    })
});


export default router;