// server.js
const express = require('express');
const http = require('http');               // Needed for socket.io
const { Server } = require('socket.io');    // socket.io
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi'); // import Joi

const app = express();
const server = http.createServer(app); // Wrap express with http server
const io = new Server(server, {
  cors: { origin: "*" } // allow all origins (for demo)
});

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "MyApp";

// ------------------ Middleware ------------------
app.use(helmet());
app.use(cors());
app.use(express.json()); // important for reading JSON body

// ------------------ Joi Schema ------------------
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  birth_year: Joi.number().integer().min(1900).max(new Date().getFullYear())
});

// ------------------ API Routes ------------------
// POST /api/users → validate user data
app.post('/api/users', (req, res) => {
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: 'Invalid data',
      details: error.details
    });
  }

  console.log('Validated data:', value);
  res.status(201).json({
    message: 'User created successfully!',
    data: value
  });
});

// test route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // serve chat client
});

// ------------------ WebSocket ------------------
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', `[${socket.id} says]: ${msg}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ------------------ Start Server ------------------
server.listen(PORT, () => {
  console.log(`🚀 ${APP_NAME} with WebSocket running on http://localhost:${PORT}`);
});
