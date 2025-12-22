const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

let isConnected = false;

const connectRedis = async () => {
  if (isConnected) return;

  try {
    await redisClient.connect();
    isConnected = true;
  } catch (err) {
    console.error("Failed to connect Redis:", err.message);
  }
};

connectRedis();

module.exports = redisClient;
