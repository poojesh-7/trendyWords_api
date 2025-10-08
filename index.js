const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const trendyRouter = require("./routes/trendyRoutes");
const wordRouter = require("./routes/wordsRoutes");
const notificationRouter = require("./routes/notificationRoutes");
const app = express();
const server = http.createServer(app); // 👈 create an HTTP server
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

// Track connected users
const connectedUsers = {}; // { userId: socketId }

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // frontend will send its user ID after login
  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} registered`);
  });

  socket.on("disconnect", () => {
    for (const [id, socketId] of Object.entries(connectedUsers)) {
      if (socketId === socket.id) delete connectedUsers[id];
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});

app.use(userRouter);
app.use(trendyRouter);
app.use(wordRouter);
app.use(notificationRouter);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
