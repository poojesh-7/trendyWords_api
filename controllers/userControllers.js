const userService = require("../services/userService");

exports.getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.send(users);
};

exports.register = async (req, res) => {
  try {
    const result = await userService.register(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await userService.login(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getProfile = (req, res) => {
  res.status(200).send(req.user);
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.user, req.body);
    res.status(201).send(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await userService.logout(req.user.id, req.token);
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e);
  }
};
