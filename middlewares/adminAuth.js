const adminAuth = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(403).json({ message: "Unauthorized" });
  }
};

module.exports = adminAuth;