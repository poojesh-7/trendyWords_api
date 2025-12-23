require("dotenv").config();
const http = require("http");

const redis = require("../config/redis");
const pool = require("../db/db");
const {
  connectRabbitMQ,
  consumeQueue,
  QUEUE_NAME,
} = require("../config/rabbitmq");

const PORT = process.env.PORT || 3000;

const startWorker = async () => {
  try {
    await connectRabbitMQ();

    await consumeQueue(QUEUE_NAME, async (data) => {
      if (data.type !== "NEW_TRENDY_WORD") return;

      const { trendy_word, trendyId, addedBy } = data;

      const usersToNotify = await pool.query(
        "SELECT id FROM users WHERE id <> $1 AND notifications_enabled = true",
        [addedBy]
      );

      await Promise.all(
        usersToNotify.rows.map(async (row) => {
          try {
            await pool.query(
              `INSERT INTO notifications (user_id, message, type, data)
               VALUES ($1, $2, 'new_word', $3::jsonb)`,
              [
                row.id,
                `New trendy word added: ${trendy_word}`,
                { trendyId, addedBy },
              ]
            );

            await redis.publish(
              "socket_notifications",
              JSON.stringify({
                receiverId: row.id,
                payload: {
                  event: "newWordNotification",
                  data: { trendy_word, addedBy },
                },
              })
            );
          } catch (err) {
            console.error(`Failed to notify user ${row.id}:`, err.message);
          }
        })
      );
    });

    console.log("Notification worker consuming messages");

    // ---- Dummy HTTP server AFTER worker is ready ----
    http
      .createServer((req, res) => {
        res.writeHead(200);
        res.end("Worker alive");
      })
      .listen(PORT, "0.0.0.0", () => {
        console.log(`Worker dummy server running on port ${PORT}`);
      });
  } catch (err) {
    console.error("Worker crashed, retrying in 5s:", err.message);
    setTimeout(startWorker, 5000);
  }
};

startWorker();
