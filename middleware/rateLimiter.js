const rateLimit = require("express-rate-limit");

module.exports = (operationName, max = 10, timeInMs = 1000 * 60 * 60) => {
  return rateLimit({
    windowMs: timeInMs,
    max,
    message: `Too many attempts to ${operationName}. Please try after sometime.`
  })
};
