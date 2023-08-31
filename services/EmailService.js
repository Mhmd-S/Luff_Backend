import Email from "../models/Email.js";

export const saveEmailandCode = (email, code) => {
    const newEmail = new Email({
        email: email,
        code: code
    });
    newEmail.save();
};

export const checkEmail = async(email) => {
    const emailResult = await Email.findOne({ email: email }).exec();
    if (emailResult) {
        return emailResult;
    }
    return null;
};

export const deleteEmailandCode = async(email) => {
    const result = await Email.findOneAndDelete({ email: email }).exec();
    return result;
}