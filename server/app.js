const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');

app.use('/uploads', express.static(
  path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')
));

app.use('/api/auth',          require('./src/routes/auth'));
app.use('/api/creator',       require('./src/routes/creator'));
app.use('/api/brand',         require('./src/routes/brand'));
app.use('/api/campaign',      require('./src/routes/campaign'));
app.use('/api/admin',         require('./src/routes/admin'));
app.use('/api/content',       require('./src/routes/content'));
app.use('/api/social',        require('./src/routes/social'));
app.use('/api/chat',          require('./src/routes/chat'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/',                  require('./src/routes/instagram'));
const authRoutes = require('./src/routes/authRoutes');
app.use('/auth', authRoutes);

app.use(errorHandler);
module.exports = app;
