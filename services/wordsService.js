const pool = require("../db/db");

exports.getAllWords = async () => {
  const result = await pool.query("SELECT * FROM trendyWords ORDER BY id ASC");
  return result.rows;
};

exports.getWordById = async (id) => {
  const result = await pool.query("SELECT * FROM trendyWords WHERE id = $1", [
    id,
  ]);

  return result.rows[0] || null;
};
