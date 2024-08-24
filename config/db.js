const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      socketTimeoutMS: 2147483647, // Set to a very high value (maximum 32-bit signed integer)
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;