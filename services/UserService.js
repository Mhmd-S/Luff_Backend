import User from "../models/User";

export const checkEmailRegistered = async(email) => {
    const result = User.findOne({ email: email }).exec();
    if (result) {
        return true;
    }
    return false;
}