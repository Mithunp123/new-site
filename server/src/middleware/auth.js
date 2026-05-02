const { verifyJWT } = require('../helpers/jwt');
const { error } = require('../helpers/response');

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return error(res, 'Unauthorized', 401);
  try {
    req.user = verifyJWT(auth.split(' ')[1]);
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

exports.verifyBrand = (req, res, next) => {
  exports.verifyToken(req, res, () => {
    if (req.user.role !== 'brand')
      return error(res, 'Brand access only', 403);
    next();
  });
};

exports.verifyAdmin = (req, res, next) => {
  exports.verifyToken(req, res, () => {
    if (req.user.role !== 'admin')
      return error(res, 'Admin access only', 403);
    next();
  });
};
