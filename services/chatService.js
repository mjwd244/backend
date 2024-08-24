const User = require('../models/User');
const Conversation = require('../models/Conversation');

const getConversationMessages = async (mainUserId, userId) => {
  const conversation = await Conversation.findOne({
    users: { $all: [mainUserId, userId] }
  }).populate('messages');
  
  if (!conversation) throw new Error('Conversation not found');
  
  return {
    conversationId: conversation._id,
    messages: conversation.messages
  };
};

const getFriends = async (userId) => {
  const user = await User.findById(userId).populate('friends');
  if (!user) throw new Error('User not found');
  
  return user.friends;
};

const deleteFriend = async (mainUserId, friendId) => {
  await User.findByIdAndUpdate(mainUserId, {
    $pull: { friends: friendId }
  });
};

module.exports = {
  getConversationMessages,
  getFriends,
  deleteFriend
};