import * as EmailService from '../services/EmailService.js';
import * as UserService from '../services/UserService.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from "../utils/errorHandler.js";
import bcrypt from 'bcryptjs';
import {uploadUserProfileImage } from '../utils/AWS-Client';
import passport from "passport";

// Verify Email, generate code and send it to user
export const verifyEmail = async(req,res,next) => {
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

// Check if code is correct
export const checkRegistrationCode = async(req, res, next) => {
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
    async(req, res, next) => {
        const profilePicturesKeys = Object.keys(req.files.profilePicture);
        // Check if there are any profile pictures uploaded
        if (profilePicturesKeys.length > 0) {
            const profilePictureUrl = req.files.profilePicture[profilePicturesKeys[0]].location;
            // Add profile picture's link to the user's profile
            try {
                await UserService.addProfilePicture(req.user._id, profilePictureUrl);
            } catch (err) {
                return next(new AppError(500, err));
            }
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

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

export const resetPasswordRequest = async(req, res, next) => {

    // Check if email exists in databse and code is correct
    const emailResult = await EmailService.checkEmail(req.body.email);
    if (!emailResult) {
        return next(new AppError(400, 'Email not registered'));
    }

    const resetToken = Crypto.randomBytes(32).toString('hex');
    const hashedToken = Crypto.createHash('sha256').update(resetToken).digest('hex');

    try {
        await UserService.resetPasswordRequest(req.body.email, hashedToken);
    } catch (err) {
        return next(new AppError(500, err));
    }

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
          email: req.body.email,
          subject: 'Your password reset token (valid for 10 min)',
          message,
        });
    } catch (err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'Token sent to email'});
}

export const resetPassword = async(req, res, next) => {
    // Verify the token and reset the password
    const hashedToken = Crypto.createHash('sha256').update(req.params.token).digest('hex');

    const emailResult = await EmailService.checkEmail(req.body.email);

    if (!emailResult) {
        return next(new AppError(400, 'Email not registered'));
    }

    if (emailResult.token !== hashedToken) {
        return next(new AppError(400, 'Token is invalid or has expired'));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        await UserService.resetPassword(req.body.email, hashedPassword);
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