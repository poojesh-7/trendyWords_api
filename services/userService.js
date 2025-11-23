const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const generateAuth = require("../methods/session");

exports.getAllUsers = async () => {
  const users = await pool.query("SELECT * FROM users");
  return users;
};

exports.register = async ({ name, email, password }) => {
  const hash = password ? await bcrypt.hash(password, 8) : "";

  const result = await pool.query(
    "INSERT INTO users(name,email,password,notifications_enabled) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, email, hash, true]
  );

  const user = result.rows[0];
  const token = await generateAuth(user.id);

  await pool.query(
    "UPDATE users SET tokens = array_append(tokens,$1) WHERE id=$2",
    [token, user.id]
  );

  return { user, token };
};

exports.login = async ({ email, password }) => {
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  if (!result.rows.length) throw new Error("user not found");

  const user = result.rows[0];

  const isCorrect = await bcrypt.compare(password, user.password);
  if (!isCorrect) throw new Error("Incorrect Password");

  const token = await generateAuth(user.id);

  await pool.query(
    "UPDATE users SET tokens = array_append(tokens,$1) WHERE id=$2",
    [token, user.id]
  );

  return { user, token };
};

exports.updateUser = async (currentUser, updates) => {
  const { name, email, password } = updates;

  let hash = currentUser.password;
  if (password) hash = await bcrypt.hash(password, 8);

  const result = await pool.query(
    "UPDATE users SET name=$1,email=$2,password=$3 WHERE id=$4 RETURNING *",
    [name || currentUser.name, email || currentUser.email, hash, currentUser.id]
  );

  return result.rows[0];
};

exports.logout = async (userId, token) => {
  await pool.query(
    "UPDATE users SET tokens=array_remove(tokens,$1) WHERE id=$2",
    [token, userId]
  );
};
