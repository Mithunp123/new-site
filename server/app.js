const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
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

app.use(errorHandler);
module.exports = app;
