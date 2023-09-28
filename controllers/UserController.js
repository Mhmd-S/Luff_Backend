import { body, validationResult } from "express-validator";
import * as EmailService from '../services/EmailService.js';
import * as UserService from '../services/UserService.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from "../utils/errorHandler.js";
import bcrypt from 'bcryptjs';
import {uploadUserProfileImage } from '../utils/AWS-Client';
import passport from "passport";
import { userControllerValidateEmail } from "../utils/userUtils.js";

// Verify Email, generate code and send it to user
export const verifyEmail = [
    body('email')
        .matches(/^TP[0-9]{6}@mail.apu.edu.my$/)
        .withMessage('Invalid email address'),
    async(req,res,next) => {
        
        // Check for validation errors
        const errors = validationResult(req);

        // If there are errors, send to error handler
        if (!errors.isEmpty()) {
            return next(new AppError(400, errors.array()[0]));
        }
        
        // Check if email is already registered. If registered, send to error handler
        const isEmailRegistered = await UserService.checkEmailRegistered(req.body.email);
        if (isEmailRegistered) {
            return next(new AppError(400, 'Email already registered'));
        }

        // Check if a code is registered to the email. If in database less than 5 minutes, reject the request.
        const emailResult = await EmailService.checkEmail(req.body.email);
        if (emailResult) {
            return next(new AppError(400, 'Code already sent. Wait for 5 minutes to request new code.'));
        }

        // Generate code
        const code = uuidv4();

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
                return next(new AppError(500, 'Failed to send email'));
            } 
        });

        // Save email to database with email and code
        try{
            EmailService.saveEmailandCode(req.body.email, code);
        } catch(err) {
            return next(new AppError(500, 'Failed to process request. Please try again later'));
        }

        // Return success message
        res.status(200).json({status: 'success', message: 'Email sent'});
    }
]
// Change it to 6 digit code
// We are going for react native so we need to make it as simple as possible

// Check if code is correct
export const checkRegistrationCode =[
    body('email')
    .matches(/^TP[0-9]{6}@mail.apu.edu.my$/)
    .withMessage('Invalid TP email address')
    .bail(),
    body('code')
    .isUUID(4)
    .withMessage('Invalid code'),
    async(req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);

        // If there are errors, return them
        if (!errors.isEmpty()) {
          return next(new AppError(400, errors.array()[0]));
        }

        // Check if email exists in databse and code is correct
        const emailResult = await EmailService.checkEmail(req.body.email);
        if (emailResult) {
            if (emailResult.code === req.body.code) {
                await EmailService.deleteEmailandCode(req.body.email);
                return res.status(200).json(200, { status: 'success', message: 'Code is correct'});
            }
        } else {
            return next(new AppError(400, 'Email not registered'));
        }

        return res.status(200).json({status: 'success', message: 'Code is incorrect'});
    }
]

// Register user. Create a user with the main fields. Email, Name, Password and DOB.
export const registerUser = [
    body('email')
        .matches(/TP[0-9]{6}@mail.apu.edu.my/)
        .withMessage('Invalid email address')
        .escape(),
    body('password')
        .isLength({min: 8, max: 15})
        .withMessage('Password is required, minimum 8 characters, maximum 15 characters.')
        .bail()
        .escape(),
    async(req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return next(new AppError(400, errors.array()));
        }

        // Check if email is already registered. If registered, reject the request.
        const isEmailRegistered = await UserService.checkEmailRegistered(req.body.email);
        if (isEmailRegistered) {
          return next(new AppError(400, 'Email already registered'));
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const userObject = {
            email: req.body.email,
            password: hashedPassword,
        }
        
        try {
            await UserService.createUser(userObject);
        } catch (err) {
          return next(new AppError(500, err));
        }

        return res.status(200).json({status: 'success', message: 'User created'});
    }
]

// Complete User's profile. Add profile picture, bio and other details.
export const modifyBio = [
    body('bio')
        .isLength({min: 25, max: 500})
        .withMessage('Bio is required, minimum 25 and maximum 500 characters.')
        .escape(),
    async(req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return next(new AppError(400, errors.array()));
        }

        try {
            await UserService.updateUserBio(req.user._id, req.body.bio);
        } catch (err) {
          return next(new AppError(500, err));
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const addProfilePicture = [
    (req,res,next) => {
        // Verify the image 
        if (!req.files.profilePicture) {
          return next(new AppError(400, 'No image uploaded'));
        }

        // Check if the user has already uploaded 5 images
        if (req.user.profilePictures.length >= 5) {
          return next(new AppError(400, 'Maximum number of profile pictures reached'));
        }

      return next();
    },
    uploadUserProfileImage.fields([{ name: 'profilePicture', maxCount: 1 }]),
    async(req, res, next) => {
        // Update links to profile images
        const profilePicturesKeys = Object.keys(req.files.profilePicture);

        // Check if there are any profile pictures uploaded
        if (profilePicturesKeys.length > 0) {
            const profilePictureUrl = req.files.profilePicture[profilePicturesKeys[0]].location;

            // Add profile picture's link to the user's profile
            try {
                await UserService.addUserProfilePictures(req.user._id, profilePictureUrl);
            } catch (err) {
              return next(new AppError(500, err));
            }
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const loginUser = [
    body('email')
        .matches(/TP[0-9]{6}@mail.apu.edu.my/)
        .withMessage('Invalid email address')
        .escape(),
    body('password')
        .isLength({min: 8, max: 15})
        .withMessage('Invalid password')
        .bail()
        .escape(),
    (req, res, next) => {
        const errors = validationResult(req);
  
        if (!errors.isEmpty()) {
            return next(new AppError(400, errors.array()));
          }
  
        if (req.isAuthenticated()) {
            throw new AppError(400, {message: 'User already logged in'});
        }

        passport.authenticate('user-local', (err, user, info) => {
            if (err) {
                throw new AppError(500,  {message: "Couldn't proccess your request. Try again later."});
            }
        
            if (!user) {
              return next(new AppError(401, {status:'fail', message: info.message}));
            }
        
            req.login(user, (err) => {
              if (err) {
                return next(new AppError(500, err));
              }
          
              return res.status(200).json({ status: "success", message:'User logged in successfully', data: user });
        });
        })(req, res, () => {
            // Empty callback to prevent further execution of middleware
            return;
        });
    }
];

export const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({ status: "success", message: 'User authenticated', data: req.user });
    }

    return next(new AppError(401, {auth: 'User not authenticated'}));
}