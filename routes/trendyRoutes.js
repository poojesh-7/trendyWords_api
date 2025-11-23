const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const trendyWordsController = require("../controllers/trendyControllers");

router.post("/addtrendyword", auth, trendyWordsController.addTrendyWord);
router.get("/user/getmywords", auth, trendyWordsController.getMyWords);
router.delete("/:trendyId", auth, trendyWordsController.removeTrendyWord);

module.exports = router;
