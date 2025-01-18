const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

const APP_ID = '1700419007381213'; // Replace with App ID
const APP_SECRET = 'dea64633191adbbed85a42e1708e0b8e'; // Replace with your Facebook App Secret

passport.use(new FacebookStrategy({
  clientID: "1700419007381213",
  clientSecret: "dea64633191adbbed85a42e1708e0b8e",
  callbackURL: 'https://29e2-2a02-8071-5e71-4260-cd25-94db-654d-ca96.ngrok-free.app', // Replace with your callback URL
  profileFields: ['id', 'displayName', 'emails']
},
function(accessToken, refreshToken, profile, done) {
  // Here you can save the user information to your database
  // For now, we'll just return the profile
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});