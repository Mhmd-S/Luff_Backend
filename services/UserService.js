import User from "../models/User";

export const checkEmailRegistered = async(email) => {
    const result = await User.findOne({ email: email }).exec();
    console.log(result);
    if (result) {
        return true;
    }
    return false;
}