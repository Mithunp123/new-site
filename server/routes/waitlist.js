const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/', (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required' });
  }

  const filePath = path.join(__dirname, '../data/waitlist.json');
  let waitlist = [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    waitlist = JSON.parse(data);
  } catch (error) {
    console.error('Error reading waitlist.json', error);
  }

  waitlist.push({ email, role, timestamp: new Date().toISOString() });

  try {
    fs.writeFileSync(filePath, JSON.stringify(waitlist, null, 2));
    res.status(200).json({ message: 'Successfully joined the waitlist!' });
  } catch (error) {
    console.error('Error writing waitlist.json', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
