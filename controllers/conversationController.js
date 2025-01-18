const Conversation = require('../models/Conversation');

const createConversation = async (req, res) => {
  const { userId1, userId2 } = req.body;

  console.log('User ID 1:', userId1);
  console.log('User ID 2:', userId2);

  try {

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'Both user IDs must be provided and valid' });
    }


    let conversation = await Conversation.findOne({
      users: { $all: [userId1, userId2] },
    });

    if (conversation) {
      return res.json({ newConversation: false, conversation });
    }

    conversation = new Conversation({
      users: [userId1, userId2],
      messages: [] 
    });
    
    await conversation.save();
    res.json({ newConversation: true, conversation });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

module.exports = {
  createConversation
};