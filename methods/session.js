const jwt = require("jsonwebtoken");
const generateAuth = (id) => {
  const token = jwt.sign({ userid: id }, process.env.SECRET_KEY, {
    expiresIn: "1h",
  });
  return token;
};

module.exports = generateAuth;
