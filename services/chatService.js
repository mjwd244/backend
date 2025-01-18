const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Group = require('../models/Group');

const getConversationMessages = async (mainUserId, userId) => {
  console.log("Service: Searching for conversation between:", mainUserId, userId);
  const conversation = await Conversation.findOne({
    users: { $all: [mainUserId, userId] }
  }).populate('messages');
  
  if (!conversation) {
    console.error("Service: Conversation not found");
    throw new Error('Conversation not found');
  }
  console.log("Service: Retrieved conversation:", conversation);
  return {
    conversationId: conversation._id,
    messages: conversation.messages
  };
};

const getFriends = async (userId) => {
  const user = await User.findById(userId).populate('friends');
  if (!user) throw new Error('User not found');
  
  return user.friends || []; // Return an empty array if no friends are found
};

const deleteFriend = async (mainUserId, friendId) => {
  try {
    const userBefore = await User.findById(mainUserId);
  

    await User.findByIdAndUpdate(mainUserId, {
      $pull: { friends:  { friendId: friendId } }
    });

    const userAfter = await User.findById(mainUserId);
    

  
  } catch (error) {
    console.error(`Error in deleteFriend: ${error.message}`);
    throw error;
  }
};



module.exports = {
  getConversationMessages,
  getFriends,
  deleteFriend,
};