const Conversation = require('../models/Conversation');

const createConversation = async (req, res) => {
  const { userId1, userId2 } = req.body;

  try {
    let conversation = await Conversation.findOne({
      users: { $all: [userId1, userId2] },
    });

    if (conversation) {
      return res.json({ newConversation: false, conversation });
    }

    conversation = new Conversation({
      users: [userId1, userId2],
      messages: [{ text: "Hello!", sender: userId1 }],
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