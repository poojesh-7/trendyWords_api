const { createClient } = require("redis");

const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

redisClient.on("connect", () => {
  console.log("Redis connected");
});

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
