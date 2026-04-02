const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const adminAuth = require("../middlewares/adminAuth");
const pool = require("../db/db");

// GET /api/admin/stats
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
    const totalWords = await pool.query("SELECT COUNT(*) FROM trendyWords");
    const toxicWords = await pool.query(
      "SELECT COUNT(*) FROM trendyWords WHERE is_toxic = true",
    );

    res.json({
      users: totalUsers.rows[0].count,
      words: totalWords.rows[0].count,
      toxicWords: toxicWords.rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/trends
router.get("/trends", auth, adminAuth, async (req, res) => {
  try {
    const trends = await pool.query(`
      SELECT trendy_word, COUNT(*) as frequency
      FROM user_words uw
      JOIN trendyWords tw ON uw.trendy_id = tw.id
      GROUP BY trendy_word
      ORDER BY frequency DESC
      LIMIT 10
    `);

    res.json(trends.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/words
router.get("/words", auth, adminAuth, async (req, res) => {
  try {
    const words = await pool.query(`
      SELECT id, trendy_word, toxic_score
      FROM trendyWords
      ORDER BY id DESC
      LIMIT 50
    `);

    res.json(words.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY id DESC",
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/word/:id
router.delete("/word/:id", auth, adminAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM trendyWords WHERE id=$1", [req.params.id]);
    res.json({ message: "Word deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/flagged
router.get("/flagged", auth, adminAuth, async (req, res) => {
  try {
    const flagged = await pool.query(
      "SELECT * FROM trendyWords WHERE is_toxic = true ORDER BY toxic_score DESC",
    );
    res.json(flagged.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
