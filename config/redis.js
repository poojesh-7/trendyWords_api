const { createClient } = require("redis");

const redisClient = createClient(
  process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
      }
);

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

let connecting;

const connectRedis = async () => {
  if (redisClient.isOpen) return;

  if (!connecting) {
    connecting = redisClient.connect();
  }

  await connecting;
};

connectRedis();

process.on("SIGTERM", async () => {
  try {
    await redisClient.quit();
  } catch (e) {}
  process.exit(0);
});

module.exports = redisClient;
