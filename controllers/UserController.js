import { body, validationResult } from "express-validator";
import * as EmailService from '../services/EmailService.js';
import * as UserService from '../services/UserService.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from "../utils/errorHandler.js";
import bcrypt from 'bcryptjs';
import {uploadUserProfileImage } from '../utils/AWS-Client';
import passport from "passport";

// Verify Email, generate code and send it to user
export const verifyEmail = [
    body('email').matches(/TP[0-9]{6}@mail.apu.edu.my/)
    .withMessage('Invalid email address'),
    async(req,res,next) => {
        
        // Check for validation errors
        const errors = validationResult(req);

        // If there are errors, send to error handler
        if (!errors.isEmpty()) {
            next(new AppError(400, errors.array()));
        }
        
        // Check if email is already registered. If registered, send to error handler
        const isEmailRegistered = await UserService.checkEmailRegistered(req.body.email);
        if (isEmailRegistered) {
            next(new AppError(400, 'Email already registered'));
        }

        // Check if a code is registered to the email. If in database less than 5 minutes, reject the request.
        const emailResult = await EmailService.checkEmail(req.body.email);
        if (emailResult) {
            next(new AppError(400, 'Code already sent. Wait for 5 minutes to request new code.'));
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
                next(new AppError(500, 'Failed to send email'));
            } 
        });

        // Save email to database with email and code
        try{
            EmailService.saveEmailandCode(req.body.email, code);
        } catch(err) {
            next(new AppError(500, 'Failed to process request. Please try again later'));
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
    .matches(/TP[0-9]{6}@mail.apu.edu.my/)
    .withMessage('Invalid email address')
    .bail(),
    body('code')
    .isUUID(4)
    .withMessage('Invalid code'),
    async(req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);

        // If there are errors, return them
        if (!errors.isEmpty()) {
            next(new AppError(400, errors.array()));
        }

        // Check if code is correct
        const emailResult = await EmailService.checkEmail(req.body.email);
        if (emailResult) {
            if (emailResult.code === req.body.code) {
                await EmailService.deleteEmailandCode(req.body.email);
                return res.status(200).json(200, { status: 'success', message: 'Code is correct'});
            }
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
    body('firstName')
        .isLength({min: 1, max: 50})
        .withMessage('First name is required, maximum 50 characters.')
        .bail()
        .isAlpha()
        .withMessage('First name must only contain letters')
        .escape(),
    body('lastName')
        .isLength({min: 1, max: 50})
        .withMessage('Last name is required, maximum 50 characters.')
        .bail()
        .isAlpha()
        .withMessage('First name must only contain letters')
        .escape(),
    body('password')
        .isLength({min: 8, max: 50})
        .withMessage('Password is required, minimum 8 characters, maximum 50 characters.')
        .bail()
        .isStrongPassword().withMessage('Password must contain at least 1 lowercase, 1 uppercase, 1 number and 1 special character.')
        .custom((value, {req}) => {
            if (value !== req.body.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
        .escape(),
    body('dob')
        .exists().withMessage('dob is required')
        .isDate().withMessage('Date of birth is required')
        .isAfter('1990-01-01').withMessage('Invalid date of birth')
        .isBefore('2005-01-01').withMessage('Invalid date of birth')
        .escape(), 
    body('gender')
        .matches(/male|female/).withMessage('Gender is required to be male or female'),
    async(req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            next(new AppError(400, errors.array()));
        }

        // Check if email is already registered. If registered, reject the request.
        const isEmailRegistered = await UserService.checkEmailRegistered(req.body.email);
        if (isEmailRegistered) {
            next(new AppError(400, 'Email already registered'));
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const userObject = {
            email: req.body.email,
            password: hashedPassword,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dob: req.body.dob,
        }
        
        try {
            await UserService.createUser(userObject);
        } catch (err) {
            next(new AppError(500, err));
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
            next(new AppError(400, errors.array()));
        }

        try {
            await UserService.updateUserBio(req.user._id, req.body.bio);
        } catch (err) {
            next(new AppError(500, err));
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const addProfilePicture = [
    (req,res,next) => {
        // Verify the image 
        if (!req.files.profilePicture) {
            next(new AppError(400, 'No image uploaded'));
        }

        // Check if the user has already uploaded 5 images
        if (req.user.profilePictures.length >= 5) {
            next(new AppError(400, 'Maximum number of profile pictures reached'));
        }

        next();
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
                next(new AppError(500, err));
            }
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const signinUser = [
    body('email')
      .exists().withMessage('Email field is required')
      .isEmail().withMessage('Email is not valid')
      .escape(),
    body('password')
      .exists().withMessage('Password field is required')
      .escape(),
    (req, res, next) => {
        const errors = validationResult(req);
            
        // Making the error objects more concise. Instead of have 5 props into an object containing the error path and msg ex. { email: 'Email not valid' }
        if (!errors.isEmpty()) { 
            const errorsArray = errors.array();
            const errorsObject = {};
          
            errorsArray.forEach((err) => {
              errorsObject[err.path] = err.msg;
            });
            
            throw new AppError(400, errorsObject);
        }
  
        if (req.isAuthenticated()) {
            throw new AppError(400, {auth: 'User already logged in'});
        }

        passport.authenticate('user-local', (err, user, info) => {
            if (err) {
                throw new AppError(500,  {auth: "Couldn't proccess your request. Try again later."});
            }
        
            if (!user) {
              return next(new AppError(401, {auth: info.message}));
            }
        
            req.login(user, (err) => {
              if (err) {
                return next(new AppError(500, err));
              }
          
              return res.json({ status: "success", data: user });
        });
        })(req, res, () => {
            // Empty callback to prevent further execution of middleware
            return;
        });
    }
];