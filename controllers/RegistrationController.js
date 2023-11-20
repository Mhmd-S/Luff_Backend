import * as EmailService from '../services/EmailService.js';
import * as UserService from '../services/UserService.js';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../utils/NodeMailerHandler.js';
import { AppError } from "../utils/errorHandler.js";
import * as bcrypt from 'bcrypt';

// Register user. Create a user with the main fields. Email, Name, Password and DOB.
export const registerUser = async(req, res, next) => {
    
    try {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const userObject = {
            email: req.body.email,
            password: hashedPassword,
        }
    
        await UserService.createUser(userObject);
    } catch (err) {
      return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'User created'});
}

export const verifyEmail = async(req,res,next) => {
    // Check if email already registered
    const isRegistered = await UserService.getUserByEmail(req.body.email);

    if( isRegistered ) {
        return next(new AppError(400, 'Email is already registered'));
    }

    // Check if a code is registered to the email. If in database less than 5 minutes, reject the request.
    const emailResult = await EmailService.getEmailRegistrationRequest(req.body.email);
    if (emailResult) {
        return next(new AppError(400, 'Code already sent. Wait for 5 minutes to request new code.'));
    }

    // Generate code
    const code = uuidv4();

    const to = req.body.email;
    const subject = 'Verification Code';
    const message = `Your verification code is ${code}`;

    // Save email to database with email and code
    try{
        sendEmail(to, subject, message);
        await EmailService.saveEmailandCode(req.body.email, code);
    } catch(err) {
        return next(new AppError(500, 'Failed to process request. Please try again later'));
    }

    // Return success message
    res.status(200).json({status: 'success', message: 'Email sent'});
}

// Check if code is correct
export const checkRegistrationCode = async(req, res, next) => {
    // Check if email exists in databse and code is correct
    const emailResult = await EmailService.getEmailRegistrationRequest(req.body.email);

    if (!emailResult) {
        return next(new AppError(400, 'Email not registered'));
    }
    
    if (emailResult.code === req.body.code) {
        await EmailService.deleteEmailandCode(req.body.email);
    } else {
        return next(new AppError(400, 'Code is incorrect'));
    }

    return res.status(200).json({status: 'success', message: 'Code is incorrect'});
}