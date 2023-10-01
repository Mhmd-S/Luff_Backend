import express from 'express';
import * as UserControllers from '../controllers/UserController.js';
import checkAuth from '../auth/checkAuth.js';

let router = express.Router();

router.get('/check-auth', UserControllers.checkAuth);

router.post('/verify-email', UserControllers.verifyEmail);

router.post('/verify-code', UserControllers.checkRegistrationCode);

router.post('/register', UserControllers.registerUser);

router.post('/login', UserControllers.loginUser);

router.put('/update-name', checkAuth, UserControllers.updateName);

router.put('/update-dob', checkAuth, UserControllers.updateDOB);

router.put('/update-bio', checkAuth, UserControllers.updateBio);

router.put('/add-profile-pics', checkAuth, UserControllers.addProfilePicture);

// router.delete('/delete-image', checkAuth, UserControllers.delete);

export default router;