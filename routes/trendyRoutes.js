const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const auth = require("../middlewares/auth");

router.post("/addtrendyword", auth, async (req, res) => {
  const userId = req.user.id;
  const { trendy_word, alter_word } = req.body;

  if (!trendy_word.trim())
    return res.status(400).json({ error: "Enter the word" });
  if (!alter_word.trim())
    return res.status(400).json({ error: "Enter the meaning" });

  try {
    const words = await pool.query(
      `INSERT INTO trendyWords (trendy_word, alter_word)
       VALUES ($1, $2)
       ON CONFLICT (trendy_word) DO UPDATE SET alter_word = EXCLUDED.alter_word
       RETURNING id, trendy_word`,
      [trendy_word.toLowerCase(), alter_word.toLowerCase()]
    );

    const { id: trendyId, trendy_word: word } = words.rows[0];

    await pool.query(
      `INSERT INTO user_words (user_id, trendy_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, trendyId]
    );

    const result = await pool.query(
      "SELECT id FROM users WHERE id <> $1 AND notifications_enabled = true",
      [userId]
    );

    for (const row of result.rows) {
      try {
        const socketId = req.connectedUsers[row.id];
        if (socketId) {
          req.io.to(socketId).emit("newWordNotification", {
            trendy_word: word,
            addedBy: userId,
          });
        }

        const data = { trendyId, addedBy: userId };

        await pool.query(
          `INSERT INTO notifications (user_id, message, type, data)
           VALUES ($1, $2, 'new_word', $3::jsonb)`,
          [row.id, `New trendy word added: ${word}`, data]
        );
      } catch (err) {
        console.error(`Failed to notify user ${row.id}:`, err.message);
      }
    }

    res.json({
      message: "✅ Word added successfully",
      trendy_word: word,
      trendyId,
    });
  } catch (err) {
    console.error("Error in addtrendyword route:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/getmywords", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT tw.* 
       FROM user_words uw
       JOIN trendyWords tw ON uw.trendy_id = tw.id
       WHERE uw.user_id = $1
       ORDER BY tw.id ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:trendyId", auth, async (req, res) => {
  const userId = req.user.id;
  const { trendyId } = req.params;
  try {
    await pool.query(
      "DELETE FROM user_words WHERE user_id = $1 AND trendy_id = $2",
      [userId, trendyId]
    );
    res.json({ message: "Word removed from user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
