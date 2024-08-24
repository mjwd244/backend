const express = require('express');
const { register, resetPassword, sendResetEmail, sendVerificationEmail, verifyEmail, login, logoutUser } = require('../controllers/authController');

const {  getConversationMessages,
  getFriends,
  deleteFriend,
  sendMessage, } = require('../controllers/chatController');
const {createConversation } = require('../controllers/conversationController');
const {  searchUsers,addFriend ,getUserById} = require('../controllers/userController');
const User = require('../models/User'); // Ensure User model is imported
const { body, check, validationResult } = require('express-validator');

const router = express.Router();

const validateEmail = [
  [
    check('displayName', 'Display Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


const validatePassword = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


router.post('/forgot-password', sendResetEmail);
router.post('/reset-password/:token',validatePassword, resetPassword);
router.post('/register', validateEmail, validatePassword, register);
router.post('/login', validateEmail, validatePassword,  login);
router.post('/', createConversation);
router.post('/logout', logoutUser);



router.get('/search-users', searchUsers);
router.post('/:id/friends', addFriend);
router.get('/:id', getUserById);

router.get('/conversations/:mainUserId/:userId',getConversationMessages);
router.get('/friends/:userId', getFriends);
router.delete('/friends/:mainUserId/:friendId', deleteFriend);
router.post('/send-message', sendMessage); 





router.post('/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Email received:', email); // Debugging line

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (user) {
      await sendVerificationEmail(user);
      res.status(200).json({ message: 'Verification email sent' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error sending verification email:', error); // Debugging line
    res.status(500).json({ message: 'Internal server error' });
  }
});
  router.get('/verify-email/:token', verifyEmail);

module.exports = router;