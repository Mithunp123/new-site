const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'general';
    const dir = path.join(process.env.UPLOAD_DIR, String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|pdf/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('File type not allowed'));
};

exports.single = (field) => multer({ storage, fileFilter }).single(field);
exports.multiple = (field, max) => multer({ storage, fileFilter }).array(field, max);

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const creatorId = req.user.id;
    const campaignId = req.params.campaignId;
    const dir = path.join(
      process.env.UPLOAD_DIR,
      'content',
      String(creatorId),
      String(campaignId)
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `content_v${timestamp}${ext}`);
  }
});

const videoFilter = (req, file, cb) => {
  const allowed = /mp4|mov|avi|mkv|webm|jpg|jpeg|png|pdf/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only video and image files are allowed'));
  }
};

exports.uploadContent = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }  // 500MB max
}).single('content');
