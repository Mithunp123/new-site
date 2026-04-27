const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const filePath = path.join(__dirname, '../data/contacts.json');
  let contacts = [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    contacts = JSON.parse(data);
  } catch (error) {
    console.error('Error reading contacts.json', error);
  }

  contacts.push({ name, email, message, timestamp: new Date().toISOString() });

  try {
    fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
    res.status(200).json({ message: 'Message received!' });
  } catch (error) {
    console.error('Error writing contacts.json', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
