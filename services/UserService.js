import User from "../models/User"; 
import { deleteObjectFromBucket } from '../utils/AWS-Client';

export const checkEmailRegistered = async(email) => {
    const result = await User.findOne({ email: email }).exec();
    console.log(result);
    if (result) {
        return true;
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

export const addProfilePicture = async(userId, profilePictures) => {
    const result = await User.findByIdAndUpdate(userId, { profilePictures: { $push: profilePictures } }).exec();
    return result;
}

export const deleteProfilePicture = async(userId, imageURL) => {
    const result = await User.findByIdAndUpdate(userId, { profilePictures: { $pull: imageURL } }).exec();
    return result;
}