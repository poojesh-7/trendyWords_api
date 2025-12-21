require("dotenv").config();
require("../config/redis");
const redis = require("../config/redis");
const pool = require("../db/db");
const {
  connectRabbitMQ,
  consumeQueue,
  QUEUE_NAME,
} = require("../config/rabbitmq");

(async () => {
  await connectRabbitMQ();

  await consumeQueue(QUEUE_NAME, async (data) => {
    if (data.type !== "NEW_TRENDY_WORD") return;

    const { trendy_word, trendyId, addedBy } = data;

    const usersToNotify = await pool.query(
      "SELECT id FROM users WHERE id <> $1 AND notifications_enabled = true",
      [addedBy]
    );

    for (const row of usersToNotify.rows) {
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
    }
  });

  console.log("Notification worker consuming messages");
})();