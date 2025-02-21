const httpResponse = require("../helper/httpResponse");
const { Accounts, Panitias } = require("../models");
const { decodeToken } = require("../tools/jwt/jwtConfig");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return httpResponse.notFoundResponse(res, "Token Not Found");
  }
  
  try {
    const result = decodeToken(token);

    const user = await Accounts.findByPk(result.id);

    if (!user) {
      const userMobile = await Panitias.findByPk(result.id);

      if (userMobile) {
        req.user = userMobile;
        return next();
      } else {
        return httpResponse.unauthorizedResponse(res, "Invalid access token");
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return httpResponse.serverErrorResponse(res, "Internal server error");
  }
};

module.exports = {
  authenticateToken,
};
