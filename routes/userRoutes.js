const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers");
const {
  registerValidator,
  loginValidator,
  updateUserValidator,
} = require("../validators/userValidator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");

router.get("/", userController.getAllUsers);

router.post("/register", registerValidator, validate, userController.register);

router.post("/login", loginValidator, validate, userController.login);

router.get("/profile", auth, userController.getProfile);

router.put(
  "/update",
  updateUserValidator,
  validate,
  auth,
  userController.updateUser
);

router.post("/logout", auth, userController.logout);

module.exports = router;
