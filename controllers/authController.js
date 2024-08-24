const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const axios = require('axios');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const sendResetEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log('Reset token generated and saved:', resetToken);

    const resetUrl = `http://${req.headers.host}/api/auth/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the following link, or paste it into your browser to complete the process:\n\n${resetUrl}`;

    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: process.env.HOTMAIL_USER, // Your Hotmail address
        pass: process.env.HOTMAIL_PASS, 
      },
    });

    const mailData = {
      from: process.env.HOTMAIL_USER, // Use a valid email address
      to: user.email,
      subject: 'Password Reset Request',
      text: message,
    };

    const info = await transporter.sendMail(mailData);
    console.log('Mail data set:', mailData);
    console.log('Email sent:', info.response);



    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const sendVerificationEmail = async (user) => {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = verificationToken;
  await user.save();

  const verificationUrl = `http://${req.headers.host}/api/auth/verify-email/${verificationToken}`;
  const message = `Please verify your email by clicking the following link: \n\n${verificationUrl}`;

  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: process.env.HOTMAIL_USER,
      pass: process.env.HOTMAIL_PASS,
    },
  });

  const mailData = {
    from: process.env.HOTMAIL_USER,
    to: user.email,
    subject: 'Email Verification',
    text: message,
  };

  await transporter.sendMail(mailData);
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
    const { displayName, email, password, photoURL } = req.body;

    console.log('Received registration request:', { displayName, email, photoURL });

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      displayName,
      email,
      password: hashedPassword,
      photoURL,
    });

    await user.save();
    //console.log('User created successfully:', user);
    console.log('User created successfully:', user.toObject({ getters: true, virtuals: false }));

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server error' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('JWT token generated successfully:', token);

    res.status(201).json({ token, user: { id: user._id, displayName, photoURL } });
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
    console.log('JWT token generated');

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

const logoutUser = (req, res) => {
  // Assuming you are using sessions
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).json({ message: 'Logged out successfully' });
  });
};






module.exports = {resetPassword, sendResetEmail ,sendVerificationEmail, verifyEmail,register,login,  logoutUser};