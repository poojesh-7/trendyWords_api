require("./config/redis");
const redis = require("./config/redis");
const { connectRabbitMQ } = require("./config/rabbitmq");
connectRabbitMQ();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const trendyRouter = require("./routes/trendyRoutes");
const wordRouter = require("./routes/wordsRoutes");
const notificationRouter = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

const connectedUsers = {};

io.on("connection", (socket) => {
  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} registered`);
  });

  socket.on("disconnect", () => {
    for (const [id, socketId] of Object.entries(connectedUsers)) {
      if (socketId === socket.id) {
        delete connectedUsers[id];
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

const subscriber = redis.duplicate();

(async () => {
  await subscriber.connect();

  await subscriber.subscribe("socket_notifications", (message) => {
    const { receiverId, payload } = JSON.parse(message);

    const socketId = connectedUsers[receiverId];
    if (socketId) {
      io.to(socketId).emit(payload.event, payload.data);
    }
  });

  console.log("Redis subscriber listening for socket events");
})();

app.use(userRouter);
app.use(trendyRouter);
app.use(wordRouter);
app.use(notificationRouter);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
