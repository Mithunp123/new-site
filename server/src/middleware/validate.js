const { error } = require('../helpers/response');

module.exports = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return error(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }
    next();
  };
};
