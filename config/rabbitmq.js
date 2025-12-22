const amqp = require("amqplib");

const QUEUE_NAME = "notifications";
const RABBITMQ_URL = process.env.RABBITMQ_URL;

let connection;
let channel;
let connecting;

const connectRabbitMQ = async () => {
  if (channel) return;
  if (!connecting) {
    connecting = _connect();
  }
  await connecting;
};

const _connect = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);

    connection.on("error", (err) => {
      console.error("RabbitMQ error:", err.message);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed. Reconnecting...");
      channel = null;
      connection = null;
      connecting = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.prefetch(1);

    console.log("RabbitMQ connected");
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
    connecting = null;
    setTimeout(connectRabbitMQ, 5000);
  }
};

const publishToQueue = async (queue, message) => {
  await connectRabbitMQ();

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

const consumeQueue = async (queue, callback) => {
  await connectRabbitMQ();

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      await callback(data);
      channel.ack(msg);
    } catch (err) {
      console.error("Message processing failed:", err.message);
      channel.nack(msg, false, false);
    }
  });
};

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing RabbitMQ...");
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (err) {
    console.error("Shutdown error:", err.message);
  } finally {
    process.exit(0);
  }
});

process.on("SIGINT", async () => {
  process.emit("SIGTERM");
});

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  consumeQueue,
  QUEUE_NAME,
};
