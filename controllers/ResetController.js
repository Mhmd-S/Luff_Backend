import { sendEmail } from '../utils/NodeMailerHandler.js';
import bcrypt from 'bcryptjs';
import Crypto from 'crypto';
import { AppError } from '../utils/errorHandler.js';
import * as UserService from '../services/UserService.js';

export const requestResetPassword = async(req, res, next) => {

    // Check if email exists in databse and code is correct
    try {
        const userInfo = await UserService.getUserByEmail(req.body.email);

        if (!userInfo) {
            return next(new AppError(400, 'Email not registered'));
        }

        const userId = userInfo._id;

        // Delete any existing reset tokens
        await UserService.deleteResetToken(userId);
    
        // Generate token
        const resetToken = Crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 15);
        
        // Save token to database
        await UserService.resetPasswordRequest(userId, hash);
        
        const to = req.body.email;
        const subject = 'Reset Password';
        const message = `Forgot your password? Reset your password using this link, http://127.0.0.1:5173/reset-password?token=${resetToken}&id=${userId} \nIf you didn't forget your password, please ignore this email!`;

        sendEmail(to, subject, message);

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