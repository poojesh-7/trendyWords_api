const pool = require("../db/db");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.addTrendyWord = async (userId, body, io, connectedUsers) => {
  const { trendy_word, alter_word } = body;

  if (!trendy_word?.trim()) throw new Error("Enter the word");
  if (!alter_word?.trim()) throw new Error("Enter the meaning");

  const response = await fetch(`${process.env.ML_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trendy_word }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const aiData = await response.json();
  const isToxic = aiData.is_toxic ?? false;
  const toxicScore = aiData.toxic_score ?? 0;

  if (isToxic) {
    throw new Error(
      // `Word flagged as inappropriate (Toxicity score: ${toxicScore.toFixed(2)})`
      `Word flagged as inappropriate `
    );
  }

  const words = await pool.query(
    `INSERT INTO trendyWords (trendy_word, alter_word, is_toxic, toxic_score)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (trendy_word)
     DO UPDATE SET alter_word = EXCLUDED.alter_word,
                   is_toxic = EXCLUDED.is_toxic,
                   toxic_score = EXCLUDED.toxic_score
     RETURNING id, trendy_word`,
    [trendy_word.toLowerCase(), alter_word.toLowerCase(), isToxic, toxicScore]
  );

  const { id: trendyId, trendy_word: word } = words.rows[0];

  await pool.query(
    `INSERT INTO user_words (user_id, trendy_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, trendyId]
  );

  const usersToNotify = await pool.query(
    "SELECT id FROM users WHERE id <> $1 AND notifications_enabled = true",
    [userId]
  );

  for (const row of usersToNotify.rows) {
    try {
      const socketId = connectedUsers[row.id];
      if (socketId) {
        io.to(socketId).emit("newWordNotification", {
          trendy_word: word,
          addedBy: userId,
        });
      }

      await pool.query(
        `INSERT INTO notifications (user_id, message, type, data)
         VALUES ($1, $2, 'new_word', $3::jsonb)`,
        [
          row.id,
          `New trendy word added: ${word}`,
          { trendyId, addedBy: userId },
        ]
      );
    } catch (err) {
      console.error(`⚠️ Failed to notify user ${row.id}:`, err.message);
    }
  }

  return {
    message: "Word added successfully",
    trendy_word: word,
    trendyId,
    toxic_score: toxicScore,
  };
};

exports.getMyWords = async (userId) => {
  const result = await pool.query(
    `SELECT tw.* 
     FROM user_words uw
     JOIN trendyWords tw ON uw.trendy_id = tw.id
     WHERE uw.user_id = $1
     ORDER BY tw.id ASC`,
    [userId]
  );

  return result.rows;
};

exports.removeTrendyWord = async (userId, trendyId) => {
  await pool.query(
    "DELETE FROM user_words WHERE user_id = $1 AND trendy_id = $2",
    [userId, trendyId]
  );
};
