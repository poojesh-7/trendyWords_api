const express = require("express");
const app = express();
const PORT = 3000;
app.use(express.json());
const userRouter = require("./routes/userRoutes");
const trendyRouter = require("./routes/trendyRoutes");
const wordRouter = require("./routes/wordsRoutes");
app.use(userRouter);
app.use(trendyRouter);
app.use(wordRouter);
app.listen(PORT, () => {
  console.log(`listening on port:${PORT}`);
});
