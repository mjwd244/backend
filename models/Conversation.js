const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    text: String,
    createdAt: { type: Date, default: Date.now },
    // other fields...
  }],
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;