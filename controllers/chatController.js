const chatService = require('../services/chatService.js');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');


const getConversationMessages = async (req, res) => {
  try {
    const { mainUserId, userId } = req.params;
    const data = await chatService.getConversationMessages(mainUserId, userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await chatService.getFriends(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFriend = async (req, res) => {
  try {
    const { mainUserId, friendId } = req.params;
    await chatService.deleteFriend(mainUserId, friendId);
    res.json({ message: 'Friend deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
    try {
      const { conversationId, text, sender } = req.body;
      const message = new Message({ text, sender });
      await message.save();
  
      const conversation = await Conversation.findById(conversationId);
      conversation.messages.push(message);
      await conversation.save();
  
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
 

  
module.exports = {
  getConversationMessages,
  getFriends,
  deleteFriend,
  sendMessage,
  
};