const trendyService = require("../services/wordsService");

exports.getAllWords = async (req, res) => {
  try {
    const words = await trendyService.getAllWords();
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWordById = async (req, res) => {
  try {
    const word = await trendyService.getWordById(req.params.id);
    if (!word) return res.status(404).json({ error: "Not found" });
    res.json(word);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
