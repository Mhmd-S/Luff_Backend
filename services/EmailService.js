import Email from "../models/Email.js";
import User from "../models/User.js";

export const saveEmailandCode = async(email, code) => {
    const newEmail = new Email({
        email: email,
        code: code
    });
    await newEmail.save();
}

export const getEmailRegistrationRequest = async(email) => {
    const emailResult = await Email.findOne({ email: email }).exec();
    if (emailResult) {
        return emailResult;
    }
}

export const deleteEmailandCode = async(email) => {
    const result = await Email.findOneAndDelete({ email: email }).exec();
    return result;
}

