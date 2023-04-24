const { Socket } = require("engine.io");
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
//joining current dir n public folder frontend
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";
//run when client connect
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //welcome current user
    socket.emit("message", formatMessage(botName, "welcome to Chatcord"));

    //console.log("new websocket connect...");
    //broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    //send user and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for chat Message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.io);
    //console.log(msg);
    io.to(user.room).emit("message", formatMessage("USER", msg));
  });

  //runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.io);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} a user has left a chat `)
      );

      //send user and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`serevr running on port ${PORT}`));
