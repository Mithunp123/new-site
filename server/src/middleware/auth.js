const { verifyJWT } = require('../helpers/jwt');
const { error } = require('../helpers/response');
const pool = require('../config/db');

// Check if a token has been explicitly revoked (session logout)
const isRevoked = async (token) => {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM revoked_tokens WHERE token = ? LIMIT 1',
      [token]
    );
    return rows.length > 0;
  } catch {
    return false; // If table doesn't exist yet, don't block requests
  }
};

exports.verifyToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return error(res, 'Unauthorized', 401);

  const token = auth.split(' ')[1];

  try {
    req.user = verifyJWT(token);
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }

  // Check revocation list
  if (await isRevoked(token)) {
    return error(res, 'Session has been revoked. Please log in again.', 401);
  }

  next();
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
    if (!['admin', 'super_admin', 'moderator'].includes(req.user.role))
      return error(res, 'Admin access only', 403);
    next();
  });
};
