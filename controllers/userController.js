const User = require('../models/User');
const mongoose = require('mongoose');

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addFriend = async (req, res) => {
  const { friendId, friendName, photo } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).send('Invalid friendId');
    }
    // Convert friendId to ObjectId
    const friendObjectId = new mongoose.Types.ObjectId(friendId);

    if (user.friends.some(friend => friend.friendId.equals(friendObjectId))) {
      return res.status(200).json({ success: true, message: 'Friend already added' });
    }


    console.log(`Adding friend: { friendId: ${friendObjectId}, friendName: ${friendName}, photo: ${photo} }`);

    user.friends.push({ friendId: friendObjectId, friendName, photo, createdAt: new Date() });
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error in addFriend:', error);
    res.status(500).send('Server error');
  }
};

const searchUsers = async (req, res) => {
  try {
    const { searchTerm, userId } = req.query;
    if (!mongoose.isValidObjectId(userId)) {
      throw new Error('Invalid userId');
    }
    const regex = new RegExp(`^${searchTerm}`, 'i');
    const objectId = new mongoose.Types.ObjectId(userId);
    const users = await User.find({ displayName: regex, _id: { $ne: objectId } });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error in searchUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

  module.exports = {
    getUserById,
    searchUsers,
    addFriend,
  };

