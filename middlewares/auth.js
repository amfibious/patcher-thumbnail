const jwt = require("jsonwebtoken");
const secret = "hackerbay-AppSecret";

// Authentication Middleware
auth = function(req, res, next) {
  const token = req.header("Authorization").replace(/[Bb]earer /, "");
  if (!token) return res.status(401).send("Access denied. No token provided.");
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (ex) {
    res.status(401).send("Invalid token");
  }
};

module.exports = { auth, secret };
