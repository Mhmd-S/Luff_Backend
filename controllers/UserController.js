import * as EmailService from '../services/EmailService.js';
import * as UserService from '../services/UserService.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from "../utils/errorHandler.js";
import bcrypt from 'bcryptjs';
import {uploadUserProfileImage } from '../utils/AWS-Client';
import passport from "passport";
import Crypto from 'crypto';
import userRouteValidation from '../middlewares/form-validation/userRouteValidation.js';

// Verify Email, generate code and send it to user
export const verifyEmail = async(req,res,next) => {
        // Check if a code is registered to the email. If in database less than 5 minutes, reject the request.
        const emailResult = await EmailService.checkEmailHaveCode(req.body.email);
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

// Check if code is correct
export const checkRegistrationCode = async(req, res, next) => {
    // Check if email exists in databse and code is correct
    const emailResult = await EmailService.checkEmailHaveCode(req.body.email);
    
    console.log(emailResult, req.body.code);

    if (!emailResult) {
        throw new AppError(400, 'Email not registered');
    }
    
    if (emailResult.code === req.body.code) {
        await EmailService.deleteEmailandCode(req.body.email);
    } else {
        return next(new AppError(400, 'Code is incorrect'));
    }

    return res.status(200).json({status: 'success', message: 'Code is incorrect'});
}

// Register user. Create a user with the main fields. Email, Name, Password and DOB.
export const registerUser = async(req, res, next) => {
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

export const updateName = async (req, res, next) => {
    try {
        await UserService.updateName(req.user._id, req.body.name);
    } catch(err) {
        return next(new AppError(500, err));
    }
    res.status(200).json({status: 'success', message: "User's name updated"});
}

export const updateDOB = async (req, res, next) => {
    try {
        await UserService.updateDOB(req.user._id, req.body.dob);
    } catch(err) {
        return next(new AppError(500, err));
    }

    res.status(200).json({status: 'success', message: "User's date of birth updated"});
}


export const updateBio = async (req, res, next) => {
    try {
        await UserService.updateBio(req.user._id, req.body.bio);
    } catch(err) {
        return next(new AppError(500, err));
    }

    res.status(200).json({status: 'success', message: "User's bio updated"});
}


export const updateGender = async (req, res, next) => {
    try {
        await UserService.updateGender(req.user._id, req.body.gender);
    } catch(err) {
        return next(new AppError(500, err));
    }

    res.status(200).json({ status: 'success', message:"User's gender updated"});
    }

export const updateOrientation = async (req, res, next) => {
    try {
        await UserService.updateOrientation(req.user._id, req.body.gender);
    } catch(err) {
        return next(new AppError(500, err));
    }

    res.status(200).json({ status: 'success', message:"User's orientation updated"});
}


export const addProfilePicture = [
    uploadUserProfileImage.fields([{ name: 'profilePicture', maxCount: 1 }]),
    userRouteValidation.addProfilePictureValidation, // Used the validation here because the data if multipart and need multer to parse it
    async(req, res, next) => {
        const profilePicturesKeys = Object.keys(req.files.profilePicture);

        // Check if there are any profile pictures uploaded
        if (profilePicturesKeys.length > 0) {
        
            const profilePictureUrl = req.files.profilePicture[profilePicturesKeys[0]].location;
        
            // Add profile picture's link to the user's profile
            try {
                await UserService.addProfilePicture(req.user._id, profilePictureUrl, req.body.picNum);
                console.log(profilePictureUrl);
            } catch (err) {
                return next(new AppError(500, err));
            }
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const deleteProfilePicture = async(req, res, next) => {
    try {
        await UserService.deleteProfilePicture(req.user._id, req.body.imageURL);
    } catch(err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'User profile updated'});
}

export const onboardNext = async(req,res,next) => {
    const onboardStep = req.user.onboardStep;

    if (onboardStep == 2) {
        return next(new AppError(400, 'User already onboarded'));
    }

    try {
        await UserService.onboardStepUp(req.user._id, onboardStep + 1);
    } catch(err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'User onboard step updated'});

}

// Nothing wrong with auth, just the erros are not being handled properly
export const loginUser = (req, res, next) => {
    passport.authenticate('user-local', (err, user, info) => {
        if (err) {
            throw new AppError(500, "Couldn't proccess your request. Try again later.");
        }
    
        if (!user) {
            console.log(info)
            return next(new AppError(401, info.message));
        }
    
        req.login(user, (err) => {
          if (err) {
            return next(new AppError(500, err));
          }
      
          return res.json({ status: "success", message:"Login successfull" ,data: user });
    });
    })(req, res, () => {
      // Empty callback to prevent further execution of middleware
      return;
    });
}

export const requestResetPassword = async(req, res, next) => {

    // Check if email exists in databse and code is correct
    try {
        const emailResult = await UserService.checkEmailRegistered(req.body.email);

        if (!emailResult) {
            return next(new AppError(400, 'Email not registered'));
        }

        // Delete any existing reset tokens
        await UserService.deleteResetToken(emailResult);
    
        // Generate token
        const resetToken = Crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 15);
        
        // Save token to database
        await UserService.resetPasswordRequest(emailResult, hash);
    
        const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: http://127.0.0.1:5173/reset-password?token=${resetToken}&id=${emailResult} \nIf you didn't forget your password, please ignore this email!`;
        
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
            subject: 'Reset Password',
            text: message,
        };

        // Send email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return next(new AppError(500, 'Failed to send email'));
            } 
        });
    } catch (err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'Token sent to email'});
}

export const resetPassword = async(req, res, next) => {
    // Verify Token using user's id and token
    const hashedToken = req.query.token;
    const userId = req.query.id;

    if (!hashedToken || !userId) {
        return next(new AppError(400, 'Reset token is invalid or has expired'));
    }

    let passwordResetToken;
    // Get token using user's id
    try {
        passwordResetToken = await UserService.getResetToken(userId)
    } catch (err) {
        return next(new AppError(500, err));
    }

    if (!passwordResetToken?.token) {
       return next(new AppError(400, 'Reset token is invalid or has expired'));
    }
    
    // Verify token
    const isValid = await bcrypt.compare(hashedToken, passwordResetToken.token);

    if (!isValid) {
        return next(new AppError(400, 'Reset token is invalid or has expired'));
    }
    
    // Reset password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    try{
        await UserService.resetPassword(userId, hashedPassword);

        await UserService.deleteResetToken(userId);
    } catch (err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'Password updated'});
}

export const logoutUser = (req,res,next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ status: "success", message:'Logout successfull' })
    });
}

export const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({ status: "success", message: 'User authenticated', data: req.user });
    }

    return next(new AppError(401,'User not authenticated'));
}