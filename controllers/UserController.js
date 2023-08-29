import { body, validationResult } from "express-validator";
import * as EmailService from '../services/EmailService.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// Verify Email, generate code and send it to user
export const verifyEmail = [
    body('email').matches(/TP[0-9]{6}@mail.apu.edu.my/)
    .withMessage('Invalid email address'),
    async(req,res,next) => {
        
        // Check for validation errors
        const errors = validationResult(req);

        // If there are errors, return them
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        
        // Check if email is in database. If in database less than 5 minutes, reject the request.
        const emailResult = await EmailService.checkEmail(req.body.email);
        if (emailResult) {
            // Check if email is expired
            if (emailResult.expireAt > Date.now()) {
                return res.status(400).json({message: 'Code already sent. Wait for 5 minutes to request new code.'});
            }
        }

        // Generate code
        const code = uuidv4();

        // Save email to database with email and code
        EmailService.saveEmailandCode(req.body.email, code);

        // Send email to user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        
        // Email transporter configuration
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: req.body.email,
            subject: 'Verification Code',
            text: `Your verification code is ${code}`,
        };

        // Send email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });

        // Return success message
        res.status(200).json({message: 'Email sent'});
    }
]