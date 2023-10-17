import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User from '../models/User';

const configurePassport = () => {
  // Configure local strategy for User
  passport.use('user-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email }).exec();
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      return done(error); // Return the error to the done callback
    }
  }));

  // Configure local strategy for Admin (Uncomment and configure if needed)
  // passport.use('admin-local', new LocalStrategy({
  //   usernameField: 'email',
  //   passwordField: 'password'
  // }, async (email, password, done) => {
  //   try {
  //     const admin = await Admin.findOne({ email }).exec();
  //     if (!admin) {
  //       return done(null, false, { message: 'Invalid email or password' });
  //     }

  //     const passwordMatch = await bcrypt.compare(password, admin.password);
  //     if (passwordMatch) {
  //       return done(null, admin);
  //     } else {
  //       return done(null, false, { message: 'Incorrect password' });
  //     }
  //   } catch (error) {
  //     return done(error); // Return the error to the done callback
  //   }
  // }));

  passport.serializeUser((user, done) => {
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      dob: user.dob,
      bio: user.bio,
      onboardStep: user.onboardStep,
      verified: user.verified,
      profilePics: user.profilePics,
      createdAt: user.createdAt,
    };
    done(null, userData);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);

      const userData = {
        _id: user._id,
        name: user.name,
        dob: user.dob,
        bio: user.bio,
        onboardStep: user.onboardStep,
        verified: user.verified,
        profilePictures: user.profilePictures,
      };

      if (user) {
        done(null, userData);
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
