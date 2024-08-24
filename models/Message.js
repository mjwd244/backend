const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;