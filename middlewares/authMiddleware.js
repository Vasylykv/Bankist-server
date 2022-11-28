const ApiError = require('../exceptions/apiError');
const tokenService = require('../services/tokenService');

module.exports = function (req, res, next) {
  try {
    const authorithationHeader = req.headers.authorization;
    if (!authorithationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    const accessToken = authorithationHeader.split(' ')[1];
    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    console.log(userData);
    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }

    req.user = userData;
    next();
  } catch (e) {
    return next(ApiError.UnauthorizedError());
  }
};
