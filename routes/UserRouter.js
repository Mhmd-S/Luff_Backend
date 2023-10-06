import express from 'express';
import * as UserControllers from '../controllers/UserController.js';
import checkAuth from '../auth/checkAuth.js';
import validationMiddleware from '../middlewares/form-validation/userRouteValidation.js';

let router = express.Router();

router.get('/check-auth', UserControllers.checkAuth);

router.post('/verify-email', validationMiddleware.verifyEmailValidation, UserControllers.verifyEmail);

router.post('/verify-code', validationMiddleware.verifyCodeValidation, UserControllers.checkRegistrationCode);

router.post('/register', validationMiddleware.registerUserValidation ,UserControllers.registerUser);

router.post('/login', validationMiddleware.loginUserValidation, UserControllers.loginUser);

router.post('/logout', checkAuth,UserControllers.logoutUser);

router.put('/update-name', checkAuth, validationMiddleware.nameValidation, UserControllers.updateName);

router.put('/update-dob', checkAuth, validationMiddleware.dobValidation, UserControllers.updateDOB);

router.put('/update-bio', checkAuth, validationMiddleware.bioValidation, UserControllers.updateBio);

router.put('/update-gender', checkAuth, validationMiddleware.genderValidation, UserControllers.updateGender);

router.put('/update-orientation', checkAuth, validationMiddleware.genderValidation, UserControllers.updateOrientation);

router.put('/onboard-next', checkAuth, UserControllers.onboardNext);

router.put('/add-profile-pic', checkAuth, UserControllers.addProfilePicture);

// router.delete('/delete-image', checkAuth, UserControllers.delete);

export default router;