const multer = require('multer');
const { MAX_UPLOAD_BYTES } = require('../config/constants');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      return cb(new Error('Only .csv files are accepted.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
