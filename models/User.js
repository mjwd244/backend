const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  friendName: String,
  photo: String,
  status: {
    type: mongoose.Schema.Types.Mixed, // Allow both strings and dates
    default: function() {
      return new Date(); // Set to current date when user is created
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: function() {
      return this.authProvider === 'google';
    }
  },
  facebookId: {
    type: String,
    required: function() {
      return this.authProvider === 'facebook';
    }
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  photoURL: String, // Ensure photoURL is defined
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: mongoose.Schema.Types.Mixed, // Allow both strings and dates
    default: function() {
      return new Date(); // Set to current date when user is created
    }
  },
  emailVerificationToken: String,
  friends: [friendSchema],
  authProvider: {
    type: String,
    required: true,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;