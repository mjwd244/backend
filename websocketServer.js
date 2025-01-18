let onlineUsers = {};
const { Server } = require("socket.io");
const User = require('./models/User');
const Conversation = require('./models/Conversation'); // Add this import

function initializeWebSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: ["https://3643-2a02-8071-5e71-4260-a1a0-2a27-125d-1116.ngrok-free.app"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.emit('currentOnlineUsers', onlineUsers);

    socket.on('sendMessage', async (messageData,receiverId) => {
      try {
          const {
              conversationId,
              text,
              fileURL,
              sender,
              timestamp,
              status,
          } = messageData;
  
          const conversation = await Conversation.findById(conversationId);
          
          if (!conversation) {
              socket.emit('error', { message: 'Conversation not found' });
              return;
          }
  
          const newMessage = {
              sender,
              text,
              fileURL,
              timestamp,
              status
          };
      
          conversation.messages.push(newMessage);
          await conversation.save();
          
          
      } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
      }
  });


    socket.on('userOnline', async (userId) => {
      console.log(`User ${userId} is online with socket ID ${socket.id}`);
      onlineUsers[userId] = socket.id;

      // Update user's online status
      const userUpdateResult = await User.findByIdAndUpdate(userId, {
        status: 'online'
      });
      console.log(`Updated user ${userId} status to online:`, userUpdateResult);

      // Update status in friends' lists
      const friendsUpdateResult = await User.updateMany(
        { 'friends.friendId': userId },
        { $set: { 'friends.$.status': 'online' } }
      );
      console.log(`Updated friends' status for user ${userId}:`, friendsUpdateResult);

      io.emit('updateUserStatus', { userId, isOnline: true });
    });

 socket.on('changeStatus', async ({ userId, status }) => {
    // Update the user's status in the database
    await User.findByIdAndUpdate(userId, { status });

    // Update status in friends' lists
    await User.updateMany(
      { 'friends.friendId': userId },
      { $set: { 'friends.$.status': status } }
    );

    // Broadcast the status change to all connected clients
    io.emit('updateUserStatus', { userId, status });
  });
  
    socket.on('userOffline', async (userId) => {
      if (onlineUsers[userId]) {
        console.log(`User ${userId} is offline`);
        delete onlineUsers[userId];
        io.emit('updateUserStatus', { userId, isOnline: false });

        // Update user's offline status with the current date
        const userUpdateResult = await User.findByIdAndUpdate(userId, {
          status: new Date()
        });
        console.log(`Updated user ${userId} status to offline:`, userUpdateResult);

        // Update status in friends' lists
        const friendsUpdateResult = await User.updateMany(
          { 'friends.friendId': userId },
          { $set: { 'friends.$.status': new Date() } }
        );
        console.log(`Updated friends' status for user ${userId}:`, friendsUpdateResult);
      }
    });

    socket.on('disconnect', async () => {
      const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
      if (userId) {
        console.log(`User ${userId} disconnected`);
        delete onlineUsers[userId];
        io.emit('updateUserStatus', { userId, isOnline: false });

        // Update user's offline status with the current date
        const userUpdateResult = await User.findByIdAndUpdate(userId, {
          status: new Date()
        });
        console.log(`Updated user ${userId} status to offline:`, userUpdateResult);

        // Update status in friends' lists
        const friendsUpdateResult = await User.updateMany(
          { 'friends.friendId': userId },
          { $set: { 'friends.$.status': new Date() } }
        );
        console.log(`Updated friends' status for user ${userId}:`, friendsUpdateResult);
      }
      console.log('A user disconnected:', socket.id);
    });

  socket.on('deleteMessage', async ({ conversationId, messageId, type, userId }) => {
    console.log('Delete request received:', { conversationId, messageId, type, userId });
      try {
          const conversation = await Conversation.findById(conversationId);
          console.log('Found conversation:', conversation ? 'yes' : 'no');
          if (!conversation) {
              socket.emit('error', { message: 'Conversation not found' });
              return;
          }

          const message = conversation.messages.find(msg => msg._id.toString() === messageId);
          console.log('Found message:', message ? 'yes' : 'no');
          if (!message) {
              socket.emit('error', { message: 'Message not found' });
              return;
          }

          if (type === 'everyone') {
              // Delete message completely
              conversation.messages = conversation.messages.filter(msg => msg._id.toString() !== messageId);
          } else if (type === 'self') {
              // Mark as deleted for this user
              message.deletedFor = message.deletedFor || [];
              message.deletedFor.push(userId);
          }

          await conversation.save();

          io.emit('messageDeleted', { messageId, type });
      } catch (error) {
          console.error('Error deleting message:', error);
          socket.emit('error', { message: 'Error deleting message' });
      }
  });

  socket.on('messageReaction', async ({ messageId, reaction, userId,receiverId, conversationId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }
  
      // Find the message in the conversation
      const messageIndex = conversation.messages.findIndex(msg => msg._id.toString() === messageId);
      if (messageIndex === -1) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
  
      // Initialize reactions array if it doesn't exist
      if (!conversation.messages[messageIndex].reactions) {
        conversation.messages[messageIndex].reactions = [];
      }
  
      // Add new reaction
      conversation.messages[messageIndex].reactions.push({
        userId,
        reaction,
        timestamp: new Date()
      });
  
      // Save the updated conversation
      await conversation.save();
  
   

      const receiverSocket = onlineUsers[receiverId];
    
      if (receiverSocket) {
        // Emit only to the specific receiver
        io.to(receiverSocket).emit('messageReacted', {
          messageId,
          reaction,
          userId
        });
      }


    } catch (error) {
      console.error('Error handling message reaction:', error);
      socket.emit('error', { message: 'Error saving reaction' });
    }
  });


  });
}

module.exports = initializeWebSocketServer;




