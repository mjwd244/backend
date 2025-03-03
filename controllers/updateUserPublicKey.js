// routes/userActionsRoutes.js
const express = require('express');
const User = require('../models/User'); // Import the User model
const Report = require('../models/Report'); // Import your Report model
const { authenticateJWT } = require('../middleware/authenticateJWT'); // Import your JWT middleware

const router = express.Router();

// Block a user
router.post('/users/:id/block', authenticateJWT, async (req, res) => {
  const userIdToBlock = req.params.id;
  const currentUserId = req.user.id;

  try {
    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.blockedUsers.includes(userIdToBlock)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    user.blockedUsers.push(userIdToBlock);
    await user.save();
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock a user
router.post('/users/:id/unblock', authenticateJWT, async (req, res) => {
  const userIdToUnblock = req.params.id;
  const currentUserId = req.user.id;

  try {
    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.blockedUsers.includes(userIdToUnblock)) {
      return res.status(400).json({ message: 'User not blocked' });
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userIdToUnblock);
    await user.save();
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report a user
router.post('/users/:id/report', authenticateJWT, async (req, res) => {
  const reportedUserId = req.params.id;
  const { reason, comments } = req.body;
  const reporterId = req.user.id;

  try {
    const report = new Report({ reporterId, reportedId: reportedUserId, reason, comments });
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;