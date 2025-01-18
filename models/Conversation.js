const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
  text: String,
  fileURL: String,
  fileType: String,

  sender: String,
  timestamp: Date,
  pinned: {
    type: Boolean,
    default: false
  },
  deletedFor: [String], // Array of userIds who deleted the message
  deletedForEveryone: { type: Boolean, default: false },
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reaction: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{ type: String }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
});

const conversationSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [messageSchema]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;