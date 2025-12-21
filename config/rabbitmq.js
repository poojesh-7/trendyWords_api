const amqp = require("amqplib");

const QUEUE_NAME = "notifications";

let connection;
let channel;
let isConnecting = false;

const connectRabbitMQ = async () => {
  if (channel || isConnecting) return;

  isConnecting = true;

  try {
    connection = await amqp.connect("amqp://localhost");

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
      channel = null;
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed");
      channel = null;
    });

    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    channel.prefetch(1);

    console.log("RabbitMQ connected");
  } catch (error) {
    isConnecting = false;
    console.error("RabbitMQ connection error:", error.message);
  }
};

const publishToQueue = (queue, message) => {
  if (!channel) {
    console.error("RabbitMQ channel not ready, skipping publish");
    return;
  }

  try {
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  } catch (err) {
    console.error("Failed to publish message:", err.message);
  }
};

const consumeQueue = async (queue, callback) => {
  if (!channel) {
    console.error("RabbitMQ channel not ready, cannot consume");
    return;
  }

  await channel.consume(queue, async (msg) => {
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

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  consumeQueue,
  QUEUE_NAME,
};
