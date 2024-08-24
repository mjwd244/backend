const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
require('dotenv').config();

//const authController = require('./controllers/authController'); // Adjust the path as necessary
const authRouter = require('./routes/auth');

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// MongoDB connection
connectDB();

// Endpoint to handle forgot password
//app.post('/api/auth/forgot-password', authController.sendResetEmail);
app.use('/api/auth', authRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});