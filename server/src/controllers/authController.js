const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { success, created, error } = require('../helpers/response');

exports.registerCreator = async (req, res, next) => {
  try {
    const { name, email, phone, password, location, languages_known } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM creators WHERE email = ?', [email]);
    if (existing.length > 0) return error(res, 'Email already registered', 400);

    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO creators (name, email, phone, password_hash, location, languages_known) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, location, JSON.stringify(languages_known || [])]
    );

    const id = result.insertId;
    const token = signToken({ id, email, role: 'creator' });

    created(res, { token, creator: { id, name, email, is_verified: false, role: 'creator' } });
  } catch (err) {
    next(err);
  }
};

exports.loginCreator = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM creators WHERE email = ? AND is_active = true', [email]);
    
    if (rows.length === 0) return error(res, 'Account not found', 404);
    const creator = rows[0];

    const isMatch = await comparePassword(password, creator.password_hash);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const token = signToken({ id: creator.id, email: creator.email, role: 'creator' });
    success(res, { token, creator: { id: creator.id, name: creator.name, email: creator.email, is_verified: creator.is_verified, role: 'creator' } });
  } catch (err) {
    next(err);
  }
};

exports.registerBrand = async (req, res, next) => {
  try {
    const { name, email, phone, password, website, country } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM brands WHERE email = ?', [email]);
    if (existing.length > 0) return error(res, 'Email already registered', 400);

    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO brands (name, email, phone, password_hash, website, country) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, website, country]
    );

    const id = result.insertId;
    const token = signToken({ id, email, role: 'brand' });

    created(res, { token, brand: { id, name, email, role: 'brand' } });
  } catch (err) {
    next(err);
  }
};

exports.loginBrand = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM brands WHERE email = ? AND is_active = true', [email]);
    
    if (rows.length === 0) return error(res, 'Account not found', 404);
    const brand = rows[0];

    const isMatch = await comparePassword(password, brand.password_hash);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const token = signToken({ id: brand.id, email: brand.email, role: 'brand' });
    success(res, { token, brand: { id: brand.id, name: brand.name, email: brand.email, role: 'brand' } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check Admins
    let [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await comparePassword(password, user.password_hash);
      if (isMatch) {
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return success(res, { token, user: { ...user, role: user.role }, role: user.role });
      }
    }

    // 2. Check Brands (could be brand)
    [rows] = await pool.query('SELECT * FROM brands WHERE email = ? AND is_active = true', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await comparePassword(password, user.password_hash);
      if (isMatch) {
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return success(res, { token, user: { ...user, role: user.role }, role: user.role });
      }
    }

    // 3. Check Creators (could be creator)
    [rows] = await pool.query('SELECT * FROM creators WHERE email = ? AND is_active = true', [email]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await comparePassword(password, user.password_hash);
      if (isMatch) {
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        return success(res, { token, user: { ...user, role: user.role }, role: user.role });
      }
    }

    return error(res, 'Invalid email or password', 401);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    let table = '';
    if (req.user.role === 'creator') table = 'creators';
    else if (req.user.role === 'brand') table = 'brands';
    else if (['admin', 'super_admin', 'moderator'].includes(req.user.role)) table = 'admins';

    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id]);
    if (rows.length === 0) return error(res, 'User not found', 404);

    const { password_hash, ...user } = rows[0];
    success(res, user);
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return error(res, 'Access token required', 400);

    // Verify access token with Google
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    const googleUser = await googleRes.json();

    if (!googleUser || !googleUser.email) {
      return error(res, 'Invalid Google token', 401);
    }

    const email = googleUser.email;
    let user = null;
    let role = null;

    // 1. Check Admins
    let [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length > 0) {
      user = rows[0];
      role = user.role || 'admin';
    } else {
      // 2. Check Brands
      [rows] = await pool.query('SELECT * FROM brands WHERE email = ?', [email]);
      if (rows.length > 0) {
        user = rows[0];
        role = user.role || 'brand';
      } else {
        // 3. Check Creators
        [rows] = await pool.query('SELECT * FROM creators WHERE email = ?', [email]);
        if (rows.length > 0) {
          user = rows[0];
          role = user.role || 'creator';
        }
      }
    }

    if (user) {
      const token = signToken({ id: user.id, email: user.email, role: role });
      return success(res, { 
        token, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: role 
        }, 
        role: role 
      });
    }

    // User not found - return user info so frontend can handle registration
    return error(res, 'Account not found', 404, { googleUser });
  } catch (err) {
    next(err);
  }
};
