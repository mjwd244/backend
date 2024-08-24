const User = require('../models/User');

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

    user.friends.push({ friendId, friendName, photo, createdAt: new Date() });
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const searchUsers = async (req, res) => {
    try {
      const { searchTerm, userId } = req.query;
      const regex = new RegExp(`^${searchTerm}`, 'i');
      const users = await User.find({ displayName: regex, _id: { $ne: userId } });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  
  module.exports = {
    getUserById,
    searchUsers,
    addFriend,
  };