const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

const mongoURL = 'mongodb+srv://Piyush:Piyush1@cluster0.erzialc.mongodb.net/ChatNow';

mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const userSchema = new mongoose.Schema({
  form: { type: String, index: true },
  password: String
});

const messageSchema = new mongoose.Schema({
  message: String,
  usernme: { type: String, index: true }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

app.get("/messages", async (req, res) => {
  const start = Date.now();
  try {
    console.log("Fetching messages from the database...");
    const messages = await Message.find({});
    const end = Date.now();
    console.log(`Fetched messages in ${end - start}ms`);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages", error);
    res.status(500).send("Error retrieving messages");
  }
});

app.get("/", (req, res) => {
  res.send("Hey everyone");
});

app.get("/abc", (req, res) => {
  res.send("Hey everyone1");
});

app.post("/send_to_DB", async (req, res) => {
  const { message, usernme } = req.body;
  const newMsg = new Message({
    message,
    usernme
  });
  try {
    const start = Date.now();
    await newMsg.save();
    const end = Date.now();
    console.log(`Saved message in ${end - start}ms`);
    res.status(201).send("Message saved successfully");
  } catch (error) {
    console.error("Something went wrong", error);
    res.status(500).send("Error saving message");
  }
});

app.post("/user_name", async (req, res) => {
  const { form, password } = req.body;
  try {
    console.log("Checking if user exists...");
    const existingUser = await User.findOne({ form });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this username already exists' });
    }

    console.log("Creating new user...");
    const newUser = new User({
      form,
      password
    });

    const start = Date.now();
    await newUser.save();
    const end = Date.now();
    console.log(`User saved in ${end - start}ms`);
    res.status(201).json('User saved successfully');
  } catch (error) {
    res.status(500).json('Error saving user: ' + error.message);
  }
});

app.post("/login", async (req, res) => {
  const { form, password } = req.body;
  try {
    console.log("Checking login credentials...");
    const existingUser = await User.findOne({ form, password });
    if (existingUser) {
      res.status(200).send("Login successful");
    } else {
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    res.status(500).json({ error: 'Error logging in: ' + error.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Socket is connected");

  socket.on("chat", (message) => {
    console.log("Received message:", message);
    io.emit("chat", message);
  });

  socket.on("disconnect", () => {
    console.log("Socket is disconnected");
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
});
