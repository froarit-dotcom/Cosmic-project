const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseQuotationImage } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// Multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protect with auth in production, but for now we authenticate it
router.post('/parse-quotation', authenticate, upload.single('image'), parseQuotationImage);

module.exports = router;
