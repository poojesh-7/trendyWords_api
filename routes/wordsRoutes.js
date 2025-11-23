const express = require("express");
const router = express.Router();
const trendyController = require("../controllers/wordsControllers");

router.get("/view/allwords", trendyController.getAllWords);
router.get("/view/word/:id", trendyController.getWordById);

module.exports = router;
