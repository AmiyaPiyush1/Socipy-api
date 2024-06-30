const express = require('express');
const http = require('http');

const { Server } = require('socket.io');
const mongoose = require('mongoose');
const mongoURL = 'mongodb+srv://Piyush:Piyush1@cluster0.erzialc.mongodb.net/ChatNow';
const mongoURL2='mongodb+srv://Piyush:Piyush1@cluster0.erzialc.mongodb.net/ChatNow'
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));



mongoose.connect(mongoURL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });


  
const userSchema = new mongoose.Schema({
  form: String,
  password: String
});

const userSchema2=new mongoose.Schema({
  message:String,
  usernme:String
});


const db2 = mongoose.createConnection(mongoURL2)
db2.on('error', console.error.bind(console, "MongoDB2 connection error:"));
db2.once('open', () => console.log("MongoDB2 connected"));
const User = mongoose.model('User', userSchema);
const User2 =db2.model('User2',userSchema2);

app.get("/messages", async (req, res) => {
  try {
    const messages = await User2.find({});
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages", error);
    res.status(500).send("Error retrieving messages");
  }
});
app.get("/",(req,res)=>{
  res.send("Hey everyone")
});
app.get("/abc",(req,res)=>{
  res.send("Hey everyone1")
});
app.post("/send_to_DB",async(req,res)=>{
  const {message,usernme}=req.body;
  const newMsg=new User2({
    message:req.body.message,
    usernme:req.body.usernme
  });
  try{
  await newMsg.save();
  }catch(error){
    console.error("smthing went wrong")
  }
})

app.post("/user_name", async (req, res) => {
  const { form,password } = req.body;
  try {
    const existingUser = await User.findOne({form:req.body.form});
        if (existingUser) {
            return res.status(400).json({ error: 'User with this username already exists' });
        }
        
    const newUser = new User({
      form:req.body.form,
      password:req.body.password
    });
    await newUser.save();
    res.status(201).json('User saved successfully');
  } catch (error) {
    res.status(500).json('Error saving user: ' + error.message);
  }
});




app.post("/login", async (req, res) => {
  const { form, password } = req.body;
  try {
    const existingUser1 = await User.findOne({ form, password });
    if (existingUser1) {
      res.status(200).send("login successful");
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
