const jwt = require("jsonwebtoken");

async function isAuthenticated(req, res, next) {
  // console.log(req.headers);
  const token = req.headers.authorization.split(" ")[1];

  console.log("Token is", token);
  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: e.message });
  }
}

module.exports = {
  isAuthenticated,
};
