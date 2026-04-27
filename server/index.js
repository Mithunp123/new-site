const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const waitlistRoute = require('./routes/waitlist');
const contactRoute = require('./routes/contact');

app.use('/api/waitlist', waitlistRoute);
app.use('/api/contact', contactRoute);

// Stats route
app.get('/api/stats', (req, res) => {
  res.json({
    creators: 10000,
    brands: 100,
    payouts: 0,
    defaults: 0
  });
});

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(path.join(dataDir, 'waitlist.json'))) {
  fs.writeFileSync(path.join(dataDir, 'waitlist.json'), '[]');
}
if (!fs.existsSync(path.join(dataDir, 'contacts.json'))) {
  fs.writeFileSync(path.join(dataDir, 'contacts.json'), '[]');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
