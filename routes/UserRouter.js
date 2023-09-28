import express from 'express';
import * as UserControllers from '../controllers/UserController.js';
import checkAuth from '../auth/checkAuth.js';

let router = express.Router();

router.get('/check-auth', UserControllers.checkAuth);

router.post('/verify-email', UserControllers.verifyEmail);

router.post('/verify-code', UserControllers.checkRegistrationCode);

router.post('/register', UserControllers.registerUser);

router.post('/signin', UserControllers.signinUser);

router.put('/update-bio', checkAuth, UserControllers.modifyBio);

router.put('/add-profile-pics', checkAuth, UserControllers.addProfilePicture);

// router.delete('/delete-image', checkAuth, UserControllers.delete);

export default router;