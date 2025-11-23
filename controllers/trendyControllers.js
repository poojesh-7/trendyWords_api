const trendyWordsService = require("../services/trendyService");

exports.addTrendyWord = async (req, res) => {
  try {
    const result = await trendyWordsService.addTrendyWord(
      req.user.id,
      req.body,
      req.io,
      req.connectedUsers
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMyWords = async (req, res) => {
  try {
    const words = await trendyWordsService.getMyWords(req.user.id);
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeTrendyWord = async (req, res) => {
  try {
    await trendyWordsService.removeTrendyWord(req.user.id, req.params.trendyId);
    res.json({ message: "Word removed from user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
