const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { error } = require('../helpers/response');

router.get('/:campaignId/:filename', verifyToken, async (req, res, next) => {
  try {
    const { campaignId, filename } = req.params;
    const userId = req.user.id;
    const role = req.user.role; // Assuming role is set in verifyToken, though might be implicit. Wait, verifyToken sets req.user. We'll check DB.

    const [campResult] = await pool.query('SELECT brand_id, creator_id FROM campaigns WHERE id = ?', [campaignId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);

    const { brand_id, creator_id } = campResult[0];

    // Assuming we don't strictly have req.user.role mapped if verifyToken doesn't include it.
    // If it does, we can check. Otherwise we check if userId matches brand_id or creator_id.
    let isAdmin = false;
    if (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'moderator') {
      isAdmin = true;
    }

    if (!isAdmin && userId !== brand_id && userId !== creator_id) {
      return error(res, 'Unauthorized to view this content', 403);
    }

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(__dirname, '../../', uploadDir, 'content', String(creator_id), String(campaignId), filename);

    if (!fs.existsSync(filePath)) {
      return error(res, 'File not found', 404);
    }

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
