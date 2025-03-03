const express = require('express');
const { register, resetPassword, sendResetEmail, sendVerificationEmail, verifyEmail, login, logoutUser } = require('../controllers/authController');
const generateJWT = require('../utils/generateJWT'); 
const { OAuth2Client } = require('google-auth-library');
const { getConversationMessages, getFriends, deleteFriend, sendMessage, updatemessagePin, updateMessageUnpin ,updateMessageText } = require('../controllers/chatController');
const { createConversation } = require('../controllers/conversationController');
const { searchUsers, addFriend, getUserById } = require('../controllers/userController');
const {checkUsersituationIngroup, removeUserFromGroup,deleteGroupController} = require('../controllers/groupController')
const User = require('../models/User'); // Ensure User model is imported
const { body, check, validationResult } = require('express-validator');
const passport = require('../config/passportConfig');
require('dotenv').config();
const { authenticateJWT }  = require('../middleware/authenticateJWT');
const fetch = require('node-fetch');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');
const { updateUserPublicKey } = require('../controllers/userController');
//const userActionsRouter = require('./userActionsRoutes'); // Import the new routes


const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


//router.use('/', userActionsRouter); // Add this line


const validateEmail1 = [
  [
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
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/forgot-password', sendResetEmail);
router.post('/reset-password/:token', validatePassword, resetPassword);
router.post('/register', register);
router.post('/login', validateEmail1, validatePassword, login);
router.post('/conversations', createConversation);
router.post('/logout', logoutUser);
router.post('/sendverificationemail', sendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);

router.get('/search-users', searchUsers);
router.post('/users/:id/friends', addFriend);
router.get('/users/:id', getUserById);

router.get('/conversations/:mainUserId/:userId', getConversationMessages);
router.get('/friends/:userId', getFriends);
router.delete('/friends/:mainUserId/:friendId', deleteFriend);
router.post('/send-message', sendMessage);
router.delete('/groups/:groupId', authenticateJWT, deleteGroupController);
router.get('/groups/state/:userId/:groupId', checkUsersituationIngroup)
router.post('/groups/userRemovel/:userId/:groupId', removeUserFromGroup)
router.put('/messages/:messageId/pin', updatemessagePin)
router.put('/messages/:messageId/unpin', updateMessageUnpin)
router.put('/messages/:messageId/edit', updateMessageText)
router.post('/updatePublicKey', updateUserPublicKey);


async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  console.log('Google ID Token Payload:', payload); // Log the payload
  return payload;
}
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);
 

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        displayName: payload.name,
        photoURL: payload.picture, // Ensure photoURL is set
        authProvider: 'google', 
      });
      await user.save();
    } else {
      // Update the photoURL if the user already exists
      user.photoURL = payload.picture;
      await user.save();
    }
    
    const jwtToken = generateJWT(user);
    if (!jwtToken) {
      throw new Error('Token generation failed');
    }

    // Generate JWT or handle session
    res.status(200).json({ message: 'User authenticated', token: jwtToken, user });
  } catch (error) {
    console.error('Error verifying Google ID token:', error);
    res.status(400).json({ message: 'Invalid token' });
  }
});

// Route to initiate Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// OAuth callback route
router.get('/',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      const user = req.user;
      const jwtToken = generateJWT(user);
      if (!jwtToken) {
        throw new Error('Token generation failed');
      }
      console.log('Authentication successful, redirecting to /home');
      res.redirect('/'); // Redirect to the home page or desired route
    } catch (error) {
      console.error('Error during authentication:', error);
      res.redirect('/');
    }
  }
);

// Route to fetch user data
router.get('/user/data', authenticateJWT, async (req, res) => {
 
  try {
    const user = await User.findById(req.user.id); // Use the user ID from the JWT payload to look up the user in the database
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'This is protected data', user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});


router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Callback route where Facebook will redirect after authentication
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to home.
    res.redirect('/home');
  }
);

// Route to log out
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

router.post('/facebook', async (req, res) => {
  const { accessToken, userID } = req.body;

  if (!accessToken || !userID) {
    return res.status(400).json({ error: 'Access token and user ID are required' });
  }

  try {
    // Verify the access token with Facebook and request the profile picture
    const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`);
    const userData = await response.json();
    console.log('Facebook API response:', userData); // Log the response

    if (userData.error) {
      return res.status(400).json({ error: 'Invalid Facebook token' });
    }

    // Find or create the user in your database
    let user = await User.findOne({ facebookId: userData.id });
    if (!user) {
      user = new User({
        facebookId: userData.id,
        displayName: userData.name,
        email: userData.email,
        authProvider: 'facebook',
        photoURL: userData.picture.data.url // Save the profile picture URL
      });
      await user.save();
    } else {
      // Update the user's profile picture if it has changed
      user.photoURL = userData.picture.data.url;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user data to the frontend
    const responseData = {
      userId: user._id,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      token,
    };
    console.log('Response data:', responseData); // Log the response data
    res.json(responseData);
  } catch (error) {
    console.error('Error verifying Facebook token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create-group', authenticateJWT, async (req, res) => {
  const { groupName, userIds } = req.body;

  if (!groupName || !userIds || userIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Group name and users are required' });
  }

  try {
    // Find the users that should be added to the group
    const users = await User.find({ _id: { $in: userIds } });

    // Create new group
    const group = new Group({
      groupName,
      userIds: users.map(user => user._id),
      createdBy: req.user.userId,  // Assuming req.user contains the logged-in user's info
    });

    await group.save();

    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/groups/:groupId/messages', authenticateJWT, async (req, res) => {
  const groupId = req.params.groupId;
  const { message, sender } = req.body; // Destructure sender from the request body

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).send({ message: 'Group not found' });
    }

    const newMessage = { text: message, sender }; // Include sender in the new message
    group.messages.push(newMessage);
    await group.save();

    res.send({ message: 'Message sent successfully', newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send({ message: 'Error sending message' });
  }
});

router.get('/groups', authenticateJWT, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id; // Use query parameter or fallback to JWT user ID
    //here to return the gorups that matches one of the ids here wether userids or createdby i mean 
    // if userids that comes for parameter if it matches the userid in the group then bring this group otherwise 
    //if the the userids that come from the parameter matches the createdby by one group bring that group as well 
    const groups = await Group.find({
      $or: [
        { userIds: userId },
        { createdBy: userId }
      ]
    })
      .populate('userIds', 'displayName photoURL _id')
      .populate('createdBy', 'displayName photoURL _id')
      .populate('messages.sender', 'displayName photoURL _id'); // Populate sender in messages

      console.log('Retrieved groups:', groups); // Debug log

    const groupDetails = groups.map(group => ({
      id: group._id,
      groupName: group.groupName,
      userIds: group.userIds.map(user => ({
        id: user._id,
        displayName: user.displayName,
        photo: user.photoURL
      })),
      messages: group.messages.map(message => ({
        text: message.text,
        timestamp: message.timestamp,
        sender: {
          id: message.sender._id,
          displayName: message.sender.displayName,
          photo: message.sender.photoURL
        }
      })),
      createdBy: {
        id: group.createdBy._id,
        displayName: group.createdBy.displayName,
        photo: group.createdBy.photoURL
      }
    }));

    res.status(200).json({ success: true, groups: groupDetails });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/details', authenticateJWT, async (req, res) => {
  try {
    const { userIds } = req.body; // Expect an array of user IDs
    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.error('Invalid userIds:', userIds); // Log invalid userIds
      return res.status(400).json({ success: false, message: 'Invalid user IDs' });
    }

    // Fetch users whose IDs are in the userIds array
    const users = await User.find({ _id: { $in: userIds } }, 'displayName photoURL'); // Fetch only necessary fields
    console.log('Fetched users:', users); // Log the fetched users

    if (!users || users.length === 0) {
      console.error('No users found for userIds:', userIds); // Log if no users are found
      return res.status(404).json({ success: false, message: 'Users not found' });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;