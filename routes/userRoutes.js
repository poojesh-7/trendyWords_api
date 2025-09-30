const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const pool = require("../db/db");
const {
  registerValidator,
  loginValidator,
  updateUserValidator,
} = require("../validators/userValidator");
const generateAuth = require("../methods/session");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");

router.get("/", async (req, res) => {
  const users = await pool.query("select * from users");
  res.send(users);
});

router.post("/register", registerValidator, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let hash = "";
    if (password) {
      hash = await bcrypt.hash(password, 8);
    }
    const users = await pool.query(
      "insert into users(name,email,password) values ($1,$2,$3) returning *",
      [name, email, hash]
    );
    const user = users.rows[0];
    const token = await generateAuth(user.id);
    await pool.query(
      "update users set tokens=array_append(tokens,$1) where id=$2",
      [token, user.id]
    );
    res.status(201).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/login", loginValidator, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (!users.rows.length) {
      return res.status(401).json({ error: "user not found" });
    }
    const user = users.rows[0];
    let isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      throw new Error("Incorrect Password");
    }
    const token = generateAuth(user.id);
    await pool.query(
      "update users set tokens=array_append(tokens,$1) where id=$2",
      [token, user.id]
    );
    // const {tokens,...finalData}=user;
    res.status(201).json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/profile", auth, (req, res) => {
  res.status(200).send(req.user);
});

router.put("/update", updateUserValidator, validate, auth, async (req, res) => {
  try {
    const requestChanges = Object.keys(req.body);
    const fields = ["name", "email", "password"];
    const isValid = requestChanges.every((field) => fields.includes(field));
    if (!isValid) {
      return res.status(400).send({ error: "invalid fields" });
    }
    const { name, email, password } = req.body;
    let hash = req.user.password;
    if (password) {
      hash = await bcrypt.hash(password, 8);
    }
    const users = await pool.query(
      "update users set name=$1,email=$2,password=$3 where id=$4 returning *",
      [
        name || req.user.name,
        email || req.user.email,
        hash || req.user.password,
        req.user.id,
      ]
    );
    const user = users.rows[0];
    res.status(201).send(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    await pool.query(
      "update users set tokens=array_remove(tokens,$1) where id=$2",
      [req.token, req.user.id]
    );
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
