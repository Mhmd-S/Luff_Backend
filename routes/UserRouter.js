import express from 'express';
import * as UserControllers from '../controllers/UserController.js';
import checkAuth from '../auth/checkAuth.js';
import validationMiddleware from '../middlewares/form-validation/userRouteValidation.js';

let router = express.Router();

router.get('/check-auth', UserControllers.checkAuth);

router.get('/get-user', checkAuth, UserControllers.getUser);

router.get('/get-users', checkAuth, UserControllers.getUsers);

router.get('/get-self', checkAuth, UserControllers.getSelf);

router.post('/login', UserControllers.loginUser);

router.post('/logout', checkAuth, UserControllers.logoutUser);

router.put('/update-name', checkAuth, validationMiddleware.nameValidation, UserControllers.updateName);

router.put('/update-dob', checkAuth, validationMiddleware.dobValidation, UserControllers.updateDOB);

router.put('/update-bio', checkAuth, validationMiddleware.bioValidation, UserControllers.updateBio);

router.put('/update-gender', checkAuth, validationMiddleware.genderValidation, UserControllers.updateGender);

router.put('/update-orientation', checkAuth, validationMiddleware.orientationValidation, UserControllers.updateOrientation);

router.put('/onboard-next', checkAuth, UserControllers.onboardNext);

// Add validation here
router.put('/add-profile-pic', checkAuth, UserControllers.addProfilePicture);

router.post('/like-user', checkAuth, UserControllers.likeUser);

router.post('/reject-user', checkAuth, UserControllers.rejectUser);

// Add validation here
router.delete('/delete-profile-pic', checkAuth, UserControllers.deleteProfilePicture);

export default router;