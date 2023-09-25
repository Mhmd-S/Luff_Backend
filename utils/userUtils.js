export const userControllerValidateEmail = async(email) => {
    const isEmailRegistered = await UserService.checkEmailRegistered(email);
        if (isEmailRegistered) {
            throw new Error('Email already registered');
        }
        return true;
}

export const registerEmail = async(email) => {
    const user = await UserService.registerEmail(email);
    return user;
}