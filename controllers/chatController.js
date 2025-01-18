const chatService = require('../services/chatService.js');
const Conversation = require('../models/Conversation');
const Group = require('../models/Group');

const getConversationMessages = async (req, res) => {
  try {
    const { mainUserId, userId } = req.params;
    console.log("Fetching messages for:", mainUserId, userId); // Log request parameters
    const data = await chatService.getConversationMessages(mainUserId, userId);
    console.log("Retrieved data:", data); // Log the retrieved data
    res.json(data);
  } catch (error) {
    console.error("Error in getConversationMessages:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await chatService.getFriends(userId);
    const numberOfFriends = data.length;

    // Return a 200 status with an empty array if no friends are found
    res.json({ friends: data, numberOfFriends });
  } catch (error) {
    console.error(`Error fetching friends: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

const deleteFriend = async (req, res) => {
  try {
    const { mainUserId, friendId } = req.params;
    await chatService.deleteFriend(mainUserId, friendId);
    res.json({ message: 'Friend deleted successfully' });
  } catch (error) {
    console.error(`Error deleting friend: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, fileURL, fileType, fileName, fileSize, sender } = req.body;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const backendNgrokUrl = process.env.BACKEND_NGROK_URL;
    const message = {
      text,
      fileURL: fileURL ? (fileURL.startsWith('http') ? fileURL : `${backendNgrokUrl}${fileURL}`) : null,
      fileType,
      sender,
      timestamp: new Date()
    };

    conversation.messages.push(message);
    await conversation.save();
    res.status(200).json(message);
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

const updatemessagePin = async (req, res) => {
  try {
    console.log(`Attempting to pin message with ID: ${req.params.messageId}`);
    
    const conversation = await Conversation.findOne({
      'messages._id': req.params.messageId
    });

    if (!conversation) {
      console.log(`Conversation not found for message ID: ${req.params.messageId}`);
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = conversation.messages.id(req.params.messageId);
    message.pinned = true;
    await conversation.save();

    console.log(`Successfully pinned message:`, message);
    res.json(message);
  } catch (error) {
    console.error(`Error pinning message: ${error.message}`);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

const updateMessageUnpin = async (req, res) => {
  try {
    console.log(`Attempting to unpin message with ID: ${req.params.messageId}`);
    
    const conversation = await Conversation.findOne({
      'messages._id': req.params.messageId
    });

    if (!conversation) {
      console.log(`Conversation not found for message ID: ${req.params.messageId}`);
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = conversation.messages.id(req.params.messageId);
    message.pinned = false;
    await conversation.save();

    console.log(`Successfully unpinned message:`, message);
    res.json(message);
  } catch (error) {
    console.error(`Error unpinning message: ${error.message}`);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: error.message });
  }
};



const updateMessageText = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const updatedConversation = await Conversation.findOneAndUpdate(
    { "messages._id": req.params.messageId },
    { 
      "$set": {
        "messages.$.text": req.body.text 
      }
    },
    { new: true }
  );
  
  const editedMessage = updatedConversation.messages.find(
    msg => msg._id.toString() === req.params.messageId
  );
  
  res.json(editedMessage);
} catch (error) {
  res.status(500).json({ message: error.message });
}
}




module.exports = {
  getConversationMessages,
  getFriends,
  deleteFriend,
  sendMessage,
  updatemessagePin,
  updateMessageUnpin,
  updateMessageText
};