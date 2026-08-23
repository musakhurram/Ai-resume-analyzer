const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");
const env = require("../config/env");

async function authUser(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.headers.authorization;
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Token not provided",
    });
  }

  const isTokenBlackListed = await tokenBlackListModel.findOne({ token });
  if (isTokenBlackListed) {
    return res.status(401).json({
      message: "Token is invalid or blacklisted",
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = { authUser };
