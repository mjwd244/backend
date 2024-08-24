const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  displayName: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  photoURL: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Add this line
});

const User = mongoose.model('User', userSchema);

module.exports = User;