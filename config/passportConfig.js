const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust the path to your User model

passport.use(new GoogleStrategy({
  clientID: "243368175392-t33t6av011k67ja3ljj97rokrjchc8j5.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "https://29e2-2a02-8071-5e71-4260-cd25-94db-654d-ca96.ngrok-free.app"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        photoURL: profile.photos[0].value,
        authProvider: 'google'
      });
      await user.save();
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;