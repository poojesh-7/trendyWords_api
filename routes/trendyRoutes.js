const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const auth = require("../middlewares/auth");

router.post("/addtrendyword", auth, async (req, res) => {
  const userId = req.user.id;

  const { trendy_word, alter_word } = req.body;
  if (!trendy_word) {
    return res.status(400).json({ error: "Enter the word" });
  }
  try {
    await pool.query(
      `SELECT setval('trendywords_id_seq', (SELECT COALESCE(MAX(id),0) FROM trendyWords));`
    );

    const words = await pool.query(
      `insert into trendyWords (trendy_word,alter_word)
       VALUES ($1,$2)
       ON CONFLICT (trendy_word) DO UPDATE SET trendy_word = EXCLUDED.trendy_word
       RETURNING id, trendy_word`,
      [trendy_word.toLowerCase(), alter_word.toLowerCase()]
    );

    const { id: trendyId } = words.rows[0];

    await pool.query(
      `INSERT INTO user_words (user_id, trendy_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, trendyId]
    );

    res.json({ message: "Word added to user", trendy_word, trendyId });
  } catch (err) {
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
