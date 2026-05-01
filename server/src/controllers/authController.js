import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function register(req, res) {
  try {
    const { name, email, phone, password, location, languages_known, role, google_id } = req.body;

    if (!name || !email || (!password && !google_id)) {
      return res.status(400).json({ error: 'Name, email, and password (or google_id) are required.' });
    }

    // Check existing
    const [existing] = await pool.execute('SELECT id FROM creators WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const [result] = await pool.execute(
      `INSERT INTO creators (name, email, phone, password_hash, display_name, location, languages_known, role, google_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, passwordHash, name, location || null, languages_known ? JSON.stringify(languages_known) : null, role || 'creator', google_id || null]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: role || 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, is_verified: false, role: role || 'creator' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, is_verified, role, is_active FROM creators WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account has been deactivated.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: !!user.is_verified,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
}

export async function googleLogin(req, res) {
  try {
    const { credential, isAccessToken } = req.body;
    let payload;

    if (isAccessToken) {
      // If it's an access token, we fetch user info from Google's endpoint
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`);
      if (!response.ok) throw new Error('Invalid access token');
      payload = await response.json();
      // userinfo returns 'sub' instead of 'googleId'
      payload.googleId = payload.sub;
    } else {
      // Standard ID Token verification
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      payload.googleId = payload.sub;
    }

    const { email, name, picture, googleId } = payload;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active FROM creators WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      const user = users[0];
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account has been deactivated.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture
        }
      });
    } else {
      // User doesn't exist, return info to frontend to start wizard
      return res.json({
        isNewUser: true,
        user: {
          name,
          email,
          googleId,
          picture
        }
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed.' });
  }
}
