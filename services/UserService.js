import User from "../models/User"; 
import ResetToken from "../models/ResetToken";

export const getUserById = async(userId) => {
    const result = await User.findById(userId, "_id name dob bio gender orientation likedUsers verified profilePictures").exec();
    return result;
}

export const getUserByEmail = async(email) => {
    const result = await User.findOne({ email: email }, "_id name dob bio gender orientation verified profilePictures").exec();
    console.log(result);

    return result;
}

// Problem Sini
export const getUsers = async(amount, user) => {

    const blockedUsers = user.blockedUsers;
    const likedUsers = user.likedUsers;
    const matchedUsers = user.matches;
    const rejectedUsers = user.rejectedUsers;

    const result = await User.find({ 
        gender: user.orientation, 
        orientation: user.gender, 
        onboardStep: 2,
        _id: { $nin: [...blockedUsers, ...rejectedUsers, ...likedUsers, matchedUsers,user._id] 
        } 
    }, '_id name dob gender orientation profilePictures bio')
    .limit(amount)
    .exec();

    return result;
}

export const addToRejectedUsers = async(userId, rejectedUserId) => {
    const result = await User.findByIdAndUpdate(userId, { $push: { rejectedUsers: rejectedUserId } }).exec();
    return result;
}

export const addToLikedUsers = async(userId, likedUserId) => {
    const result = await User.findByIdAndUpdate(userId, { $push: { likedUsers: likedUserId } }).exec();
    return result;
}

export const addToMatches = async(userId, matchId) => {
    const result = await User.findByIdAndUpdate(userId, { $push: { matches: matchId } }).exec();
    return result;
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

// test this
export const addProfilePicture = async (userId, profilePictureLink, picNum) => {
    const result = await User.findByIdAndUpdate(userId, { 
        $set: { 
            [`profilePictures.${picNum}`]: profilePictureLink 
        } 
    }).exec();
    return result;
}

export const deleteProfilePicture = async (userId, picNum) => {
    const result = await User.findByIdAndUpdate(userId, {
        $unset: {
            [`profilePictures.${picNum}`]: 1
        }
    }).exec();
    return result;
};


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

