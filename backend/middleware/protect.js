const errorHnadler = require("../middleware/http-error");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const secret = require("../config/config_prod").SECRET;

exports.protect = async (req, res, next) => {
  let token;

  if (req.method === "OPTIONS") {
    next();
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new errorHnadler("Not authorized", 401));
  }

  try {
    const { id } = jwt.verify(token, secret);
    req.user = await User.findById(id);
    next();
  } catch (err) {
    return next(new errorHnadler("Not authorized.", 401));
  }
};
