const jwt = require("jsonwebtoken");
const pool = require("../db/db");
const auth = async (req, res, next) => {
  try {
    const header = req.header("Authorization");
    const token = header.replace("Bearer ", "");
    if (!token) {
      throw new Error("please authenticate");
    }
    const userObj = jwt.decode(token, process.env.SECRET_KEY);
    const users = await pool.query(
      "select * from users where id=$1 and tokens @> ARRAY[$2]",
      [userObj.userid, token]
    );
    const user = users.rows[0];
    if (!user) {
      throw new Error("please authenticate");
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: e.message });
  }
};

module.exports = auth;
