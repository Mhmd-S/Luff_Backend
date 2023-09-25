import express from 'express';
import * as UserControllers from '../controllers/UserController.js';

let router = express.Router();

router.post('/verify-email', UserControllers.verifyEmail);

router.post('/verify-code', UserControllers.checkRegistrationCode);

router.post('/register', UserControllers.registerUser);

router.post('/signin', UserControllers.signinUser);

router.put('/update-bio', UserControllers.modifyBio);

router.put('/add-profile-pics', UserControllers.addProfilePicture);

// router.delete('/delete-image', UserControllers.delete);

export default router;