const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/view/allwords", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trendyWords ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/view/word/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM trendyWords WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
