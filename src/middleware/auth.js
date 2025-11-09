const jwt = require("jsonwebtoken");

function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send("You must be logged in");

  jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
    if (err) return res.status(401).send("Invalid token");
    req.user = data;
    next();
  });
}

module.exports = { isLoggedIn };