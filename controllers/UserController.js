import * as UserService from '../services/UserService.js';
import { AppError } from "../utils/errorHandler.js";

import {uploadUserProfileImage } from '../utils/AWS-Client';
import passport from "passport";

import userRouteValidation from '../middlewares/form-validation/userRouteValidation.js';


export const getUser = async(req, res, next) => {
    const user = await UserService.getUserById(req.user._id);

    if (!user) {
        return next(new AppError(400, 'User not found'));
    }

    return res.status(200).json({status: 'success', data: user});
}

export const getUsers = async(req,res,next) => {
    try{
        const result = await UserService.getUsers(10, req.user);
        res.status(200).json({status: 'success', data: result});
    }catch(err){
        return next(new AppError(500, err));
    }
}

export const getSelf = async(req, res, next) => {
    return res.status(200).json({status: 'success', data: req.user});
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

        // Check if user has uploaded a profile picture
        if (!req?.files?.profilePicture) {
            return next(new AppError(400, 'No profile picture uploaded'));
        }

        const profilePicturesKeys = Object.keys(req?.files?.profilePicture);

        // Check if there are any profile pictures uploaded
        if (profilePicturesKeys.length > 0) {
        
            const profilePictureUrl = req.files.profilePicture[profilePicturesKeys[0]].location;
        
            // Add profile picture's link to the user's profile
            try {
                await UserService.addProfilePicture(req.user._id, profilePictureUrl, req.body.picNum);
            } catch (err) {
                return next(new AppError(500, err));
            }
        } else {
            return next(new AppError(400, 'No profile picture uploaded'));
        }

        return res.status(200).json({status: 'success', message: 'User profile updated'});
    }
]

export const deleteProfilePicture = async(req, res, next) => {
    try {
        await UserService.deleteProfilePicture(req.user._id, req.body.picNum);
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
    // ToDo: Add validation for onboardStep
    try {
        await UserService.onboardStepUp(req.user._id, onboardStep + 1);
    } catch(err) {
        return next(new AppError(500, err));
    }

    return res.status(200).json({status: 'success', message: 'User onboard step updated'});

}

// Nothing wrong with auth, just the erros are not being handled properly
export const loginUser = (req, res, next) => {
    try {
        passport.authenticate('user-local', (err, user, info) => {
            if (err) {
                return next(new AppError(500, "Couldn't process your request. Try again later."));
            }

            if (!user) {
                return next(new AppError(401, info.message));
            }

            req.login(user, (err) => {
                if (err) {
                    return next(new AppError(500, err));
                }

                return res.json({ status: "success", message: "Login successful", data: user });
            });
        })(req, res, next);
    } catch (err) {
        return next(new AppError(500, err));
    }
}

export const logoutUser = (req,res,next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ status: "success", message:'Logout successfull' })
    });
}

export const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({ status: "success", message: 'User authenticated', data: true });
    }

    return next(new AppError(401,'User not authenticated'));
}