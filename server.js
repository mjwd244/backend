const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('./config/passportConfig');
const authRouter = require('./routes/auth');
const http = require('http');
require('dotenv').config();
const initializeWebSocketServer = require('./websocketServer.js');
const multer = require('multer');
const path = require('path'); 
const fs = require('fs');


if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();
const server = http.createServer(app);
initializeWebSocketServer(server);



// Add this before your other routes


app.use('/uploads', cors({
  origin: 'https://c3bc-2a02-8071-5e71-4260-e139-2951-cc9-7f90.ngrok-free.app',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Disposition', 'Content-Type']
}));

// Then in your uploads route
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).send('File not found');
  }
});




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000000 }, // Limit file size to 1MB
  fileFilter(req, file, cb) {
    console.log('File type:', file.mimetype); // Log the file type
    console.log('File name:', file.originalname); // Log the file name
    const fileExtension = path.extname(file.originalname).toLowerCase();
    console.log('File extension:', fileExtension); // Log the file extension
    if (!fileExtension.match(/\.(png|jpg|jpeg|gif|pdf|doc|docx|xlsx|ppt|pptx|txt)$/)) {
      return cb(new Error('Please upload a valid file type (png, jpg, jpeg, gif, pdf, doc, docx, xlsx, ppt, pptx, txt)'));
    }
    cb(undefined, true);
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));





const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://c3bc-2a02-8071-5e71-4260-e139-2951-cc9-7f90.ngrok-free.app',
  'https://64d2-2a02-8071-5e71-4260-e139-2951-cc9-7f90.ngrok-free.app'
];
app.use(cors({
  origin: function (origin, callback) {
   
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
   credentials: true,
  maxAge: 3600,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [
    'Access-Control-Allow-Private-Network',
    'Content-Disposition',
    'Content-Length',
    'Content-Type'
  ]
}));

app.use(express.json());
app.use(bodyParser.json());

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.use('/api/auth', authRouter);

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    const filePath = `/uploads/${req.file.filename}`;
    console.log('File uploaded to:', filePath);

    // Set file permissions to read and write for the owner, and read for others
    fs.chmodSync(path.join(__dirname, 'uploads', req.file.filename), '0644');

    // Set Content-Disposition header
    res.setHeader('Content-Type', 'application/force-download');
  res.setHeader('Content-Disposition', 'attachment; filename=' + req.file.filename);

    res.status(200).send({ filePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});





app.use((req, res, next) => {
  const ext = path.extname(req.path);
  switch (ext.toLowerCase()) {
    case '.js':
      res.set("Content-Type", "text/javascript");
      break;
    case '.css':
      res.set("Content-Type", "text/css");
      break;
    case '.png':
      res.set("Content-Type", "image/png");
      break;
    case '.jpg':
    case '.jpeg':
      res.set("Content-Type", "image/jpeg");
      break;
    case '.gif':
      res.set("Content-Type", "image/gif");
      break;
    case '.svg':
      res.set("Content-Type", "image/svg+xml");
      break;
    case '.wav':
      res.set("Content-Type", "audio/wav");
      break;
    case '.mp4':
      res.set("Content-Type", "video/mp4");
      break;
    case '.html':
      res.set("Content-Type", "text/html");
      break;
    case '.json':
      res.set("Content-Type", "application/json");
      break;
    default:
      res.set("Content-Disposition", "attachment");
  }
  next();
});

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://64d2-2a02-8071-5e71-4260-e139-2951-cc9-7f90.ngrok-free.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
// Add a catch-all route to log any unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});