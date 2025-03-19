const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const axios = require('axios');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("243368175392-t33t6av011k67ja3ljj97rokrjchc8j5.apps.googleusercontent.com");

require('dotenv').config();

const sendResetEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 second for testing
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the following link, or paste it into your browser to complete the process:\n\n${resetUrl}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailData = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: message,
    };

    await transporter.sendMail(mailData);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;  // Extract token from URL parameter
  const { password } = req.body;

  console.log('Received request to reset password');
  console.log('Token:', token);
  console.log('New Password:', password);

  if (password.length <= 6) {
    console.log('Password is too short');
    return res.status(400).json({ message: 'Password must be longer than 6 characters' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // Check if the token has not expired
    });

    if (!user) {
      console.log('Invalid or expired token');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log('User found:', user);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log('New hashed password:', user.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    console.log('User saved:', user);

    console.log('Password has been reset successfully');
    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    const message = `Please verify your email by clicking the following link: \n\n${verificationUrl}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Internal server error');
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const register = async (req, res) => {
  try {
    const { displayName, email, password, photoURL,publicKey } = req.body;
  
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      displayName,
      email,
      password: hashedPassword,
      photoURL,
      isEmailVerified: false,
      publicKey
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    console.log('User created successfully:', user.toObject({ getters: true, virtuals: false }));

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server error' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('JWT token generated successfully:', token);
    const verificationUrl = `https://c3bc-2a02-8071-5e71-4260-e139-2951-cc9-7f90.ngrok-free.app/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email, verificationUrl);

  
    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      token,
      user: { id: user._id, displayName, photoURL },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  console.log('Login request received');
  const { email, password } = req.body;
  console.log('Request body:', { email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(400).send('Invalid credentials');
    }
    console.log('User found:', user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).send('Invalid credentials');
    }
    console.log('Password matches');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('JWT token generated:', token);

    res.json({
      _id: user._id,
      displayName: user.displayName,
      photoURL: user.photoURL,
      token,
    });
    console.log('Response sent');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server error');
  }
};

const logoutUser = async (req, res) => {
  if (!req.session) {
    return res.status(400).json({ error: 'No active session' });
  }

  if (req.session.googleToken) {
    try {
      await client.revokeToken(req.session.googleToken);
      console.log('Google token revoked');
    } catch (error) {
      console.error('Failed to revoke Google token:', error);
    }
  }
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

module.exports = {resetPassword, sendResetEmail ,sendVerificationEmail, verifyEmail,register,login,  logoutUser};