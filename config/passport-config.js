import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../models/User';

// Create a function to configure a local strategy for a given user type
const configureLocalStrategy = (userModel, strategyName) => {
  passport.use(strategyName, new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await userModel.findOne({ email }).exec();
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const userData = {
          _id: user._id,
          name: user.name,
          dob: user.dob,
          bio: user.bio,
          gender: user.gender,
          matches: user.matches,
          blockedProfiles: user.blockedProfiles,
          likedProfiles: user.likedProfiles,
          orientation: user.orientation,
          onboardStep: user.onboardStep,
          verified: user.verified,
          profilePics: user.profilePics,
          createdAt: user.createdAt,
        };
        return done(null, userData);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      return done(error); // Return the error to the done callback
    }
  }));
};

const configurePassport = () => {
  // Configure local strategy for User
  configureLocalStrategy(User, 'user-local');

  // Serialize and deserialize user functions
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);

      if (user) {
        done(null, user);
      } else {
        done(new Error('User not found'));
      }
    } catch (error) {
      done(error);
    }
  });

  return passport;
};

export default configurePassport;
