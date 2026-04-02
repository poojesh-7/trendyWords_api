const express = require("express");
const router = express.Router();
const trendyController = require("../controllers/wordsControllers");

router.get("/view/allwords", trendyController.getAllWords);
router.get("/view/word/:id", trendyController.getWordById);
// GET /api/global/trends
router.get("/global/trends", async (req, res) => {
  try {
    const trends = await pool.query(`
      SELECT tw.trendy_word, COUNT(*) as frequency
      FROM user_words uw
      JOIN trendywords tw ON uw.trendy_id = tw.id
      GROUP BY tw.trendy_word
      ORDER BY frequency DESC
      LIMIT 10
    `);

    res.json(trends.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
