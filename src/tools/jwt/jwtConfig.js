const jwt = require("jsonwebtoken");
const { CONFIG } = require("../../config/config");

const generateToken = (payload) => {
  const expiresIn = "2d";

  const token = jwt.sign(payload, CONFIG.JWT.SECRET, { expiresIn });

  return token;
};

const decodeToken = (token) => {
  const decoded = jwt.verify(token, CONFIG.JWT.SECRET);

  return decoded;
};

module.exports = {
  generateToken,
  decodeToken,
};
