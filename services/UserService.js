import User from "../models/User"; 
import ResetToken from "../models/ResetToken";
import { deleteObjectFromBucket } from '../utils/AWS-Client';

export const checkEmailRegistered = async(email) => {
    const result = await User.findOne({ email: email }).exec();

    if (result) {
        return result._id;
    }
    return false;
}

export const createUser = async(userObject) => {
    const user = new User(userObject);
    await user.save();
}

export const updateName = async(userId, newName) => {
    const result = await User.findByIdAndUpdate(userId, { name: newName }).exec();
    return result;
}

export const updateBio = async(userId, newBio) => {
    const result = await User.findByIdAndUpdate(userId, { bio: newBio }).exec();
    return result;
}

export const updateDOB = async(userId, newDOB) => {
    const result = await User.findByIdAndUpdate(userId, { dob: newDOB }).exec();
    return result;
}

export const updateGender = async(userId, newGender) => {
    const result = await User.findByIdAndUpdate(userId, { gender: newGender }).exec();
    return result;
}

export const updateOrientation = async(userId, newOrientation) => {
    const result = await User.findByIdAndUpdate(userId, { orientation: newOrientation }).exec();
    return result;
}

// Remove token from database
export const resetPassword = async(userId, newPassword) => {
    const result = await User.findByIdAndUpdate(userId, { password: newPassword }).exec();
    return result;
}

export const onboardStepUp = async(userId, step) => {
    const result = await User.findByIdAndUpdate(userId, { onboardStep: step }).exec();
    return result;
}

export const addProfilePicture = async(userId, profilePictures) => {
    const result = await User.findByIdAndUpdate(userId, { profilePictures: { $push: profilePictures } }).exec();
    return result;
}

export const deleteProfilePicture = async(userId, imageURL) => {
    const result = await User.findByIdAndUpdate(userId, { profilePictures: { $pull: imageURL } }).exec();
    return result;
}

export const resetPasswordRequest = async(userId, hashedToken) => {
    const token = new ResetToken({
        userId: userId,
        token: hashedToken,
    });

    await token.save();
}

export const getResetToken = async(userId) => {
    const result = await ResetToken.findOne({ userId: userId }).exec();
    return result;
}

export const deleteResetToken = async(userId) => {
    const result = await ResetToken.findOneAndDelete({ userId: userId }).exec();
    return result;
}

