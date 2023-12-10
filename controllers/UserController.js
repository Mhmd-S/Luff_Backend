import * as UserService from '../services/UserService.js';
import { AppError } from '../utils/errorHandler.js';
import { emitMatch } from '../utils/socketio-config.js';
import { uploadUserProfileImage } from '../utils/AWS-Client';
import passport from 'passport';
import * as ChatController from './ChatController.js';
import userRouteValidation from '../middlewares/form-validation/userRouteValidation.js';

export const getUser = async (req, res, next) => {
	const user = await UserService.getUserById(req.user._id);

	if (!user) {
		return next(new AppError(400, 'User not found'));
	}

	return res.status(200).json({ status: 'success', data: user });
};

export const getUsers = async (req, res, next) => {
	try {
		const result = await UserService.getUsers(10, req.user);
		res.status(200).json({ status: 'success', data: result });
	} catch (err) {
		return next(new AppError(500, err));
	}
};

export const getSelf = async (req, res, next) => {
	return res.status(200).json({ status: 'success', data: req.user });
};

export const updateName = async (req, res, next) => {
	try {
		await UserService.updateName(req.user._id, req.body.name);
	} catch (err) {
		return next(new AppError(500, err));
	}
	res.status(200).json({ status: 'success', message: "User's name updated" });
};

// Test
export const likeUser = async (req, res, next) => {
	try {
		const user = req.user;

		// Fetch liked user from db
		const likedUser = await UserService.getUserById(req.query.userId);

		// Check if liked user exists
		if (!likedUser) {
			return next(new AppError(400, 'User does not exist'));
		}

		// Check if gender and orientation matches
		if (
			likedUser.orientation !== req.user.gender ||
			req.user.orientation !== likedUser.gender
		) {
			return next(
				new AppError(400, 'User does not match your preferences')
			);
		}

		// Check if user is already liked
		if (user.likedUsers.includes(likedUser._id)) {
			return next(new AppError(400, 'User already liked'));
		}

		// Check if user is already matched
		if (user.matches.includes(likedUser._id)) {
			return next(new AppError(400, 'User already matched'));
		}

		// Add to Likes
		await UserService.addToLikedUsers(user._id, likedUser._id);

		// Check if the liked user already liked the user
		if (likedUser.likedUsers.includes(user._id)) {
			// Add to matches
			await UserService.addToMatches(user._id, likedUser._id);
			await UserService.addToMatches(likedUser._id, user._id);

			// Create a chat
			const newChat = await ChatController.createChat([user._id, likedUser._id]);

			// Send notification to both users
			emitMatch(user, likedUser, newChat);
			emitMatch(likedUser, user, newChat);

			res.status(200).json({
				status: 'success',
				message: 'User matched',
				data: likedUser,
			});
			return;
		}

		res.status(200).json({ status: 'success', message: 'User liked' });
	} catch (err) {
		return next(new AppError(500, err));
	}
};

export const rejectUser = async (req, res, next) => {
	try {
		const rejectedUser = await UserService.getUserById(req.query.userId);

		// Check if rejected user exists
		if (!rejectedUser) {
			return next(new AppError(400, 'User does not exist'));
		}

		// Check if gender and orientation matches
		if (
			rejectedUser.orientation != req.user.gender ||
			req.user.orientation != rejectedUser.gender
		) {
			return next(
				new AppError(400, 'User does not match your preferences')
			);
		}

		// Check if user is already liked
		if (req.user.rejectedUsers.includes(rejectedUser._id)) {
			return next(new AppError(400, 'User already rejected'));
		}

		await UserService.addToRejectedUsers(req.user._id, rejectedUser._id);
	} catch (err) {
		return next(new AppError(500, err));
	}

	res.status(200).json({ status: 'success', message: 'User rejected' });
};

export const updateDOB = async (req, res, next) => {
	try {
		await UserService.updateDOB(req.user._id, req.body.dob);
	} catch (err) {
		return next(new AppError(500, err));
	}

	res.status(200).json({
		status: 'success',
		message: "User's date of birth updated",
	});
};

export const updateBio = async (req, res, next) => {
	try {
		const rsult = await UserService.updateBio(req.user._id, req.body.bio);
		console.log(rsult);
	} catch (err) {
		return next(new AppError(500, err));
	}

	res.status(200).json({ status: 'success', message: "User's bio updated" });
};

export const updateGender = async (req, res, next) => {
	console.log(req.body.gender);

	try {
		await UserService.updateGender(req.user._id, req.body.gender);
	} catch (err) {
		return next(new AppError(500, err));
	}

	res.status(200).json({
		status: 'success',
		message: "User's gender updated",
	});
};

export const updateOrientation = async (req, res, next) => {
	console.log(req.body.orientation);

	try {
		const resp = await UserService.updateOrientation(
			req.user._id,
			req.body.orientation
		);
		console.log(resp);
	} catch (err) {
		return next(new AppError(500, err));
	}

	res.status(200).json({
		status: 'success',
		message: "User's orientation updated",
	});
};

// Streaming the image to the bucket using multer. Multer returns the file object in req.file
export const addProfilePicture = [
	uploadUserProfileImage.fields([{ name: 'profilePicture', maxCount: 1 }]),
	userRouteValidation.addProfilePictureValidation, // Used the validation here because the data if multipart and need multer to parse it
	async (req, res, next) => {
		// Check if user has uploaded a profile picture
		if (!req?.files?.profilePicture) {
			return next(new AppError(400, 'No profile picture uploaded'));
		}

		const profilePicturesKeys = Object.keys(req?.files?.profilePicture);

		// Check if there are any profile pictures uploaded
		if (profilePicturesKeys.length > 0) {
			// Get the URL of the profile picture
			const profilePictureUrl =
				req.files.profilePicture[profilePicturesKeys[0]].location;

			// Add profile picture's link to the user's profile
			try {
				await UserService.addProfilePicture(
					req.user._id,
					profilePictureUrl,
					req.body.picNum
				);
			} catch (err) {
				return next(new AppError(500, err));
			}
		} else {
			return next(new AppError(400, 'No profile picture uploaded'));
		}

		return res
			.status(200)
			.json({ status: 'success', message: 'User profile updated' });
	},
];

export const deleteProfilePicture = async (req, res, next) => {
	try {
		await UserService.deleteProfilePicture(req.user._id, req.body.picNum);
	} catch (err) {
		return next(new AppError(500, err));
	}

	return res
		.status(200)
		.json({ status: 'success', message: 'User profile updated' });
};

export const onboardNext = async (req, res, next) => {
	const onboardStep = req.user.onboardStep;

	if (onboardStep == 2) {
		return next(new AppError(400, 'User already onboarded'));
	}
	// ToDo: Add validation for onboardStep
	try {
		await UserService.onboardStepUp(req.user._id, onboardStep + 1);
	} catch (err) {
		return next(new AppError(500, err));
	}

	return res
		.status(200)
		.json({ status: 'success', message: 'User onboard step updated' });
};

// Nothing wrong with auth, just the erros are not being handled properly
export const loginUser = (req, res, next) => {
	try {
		passport.authenticate('user-local', (err, user, info) => {
			if (err) {
				return next(
					new AppError(
						500,
						"Couldn't process your request. Try again later."
					)
				);
			}

			if (!user) {
				return next(new AppError(401, info.message));
			}

			req.login(user, (err) => {
				if (err) {
					return next(new AppError(500, err));
				}

				return res.json({
					status: 'success',
					message: 'Login successful',
					data: user,
				});
			});
		})(req, res, next);
	} catch (err) {
		return next(new AppError(500, err));
	}
};

export const logoutUser = (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.json({ status: 'success', message: 'Logout successfull' });
	});
};

export const checkAuth = (req, res, next) => {
	if (req.isAuthenticated()) {
		return res
			.status(200)
			.json({ status: 'success', message: 'User authenticated' });
	}

	return next(new AppError(401, 'User not authenticated'));
};
