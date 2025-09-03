const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "mon_secret"); // <--- doit être identique à la génération
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};
