const express = require('express');
const multer = require('multer');
const pingController = require('../controllers/ping.controller');
const statusController = require('../controllers/status.controller');
const messageController = require('../controllers/message.controller');
const logController = require('../controllers/log.controller');
const qrController = require('../controllers/qr.controller');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory as buffer
    limits: {
        fileSize: 16 * 1024 * 1024, // 16MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document and media types
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'video/mp4',
            'video/avi',
            'video/mov'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only documents, images, audio, and video files are allowed.'), false);
        }
    }
});

// Health check / Ping endpoint
router.get('/ping', pingController.ping);

// Status check endpoint
router.get('/status', statusController.getStatus);

// Message endpoints
router.post('/message', messageController.sendPersonalMessage);
router.post('/message/group', messageController.sendGroupMessage);

// Document endpoints
router.post('/document', messageController.sendDocumentMessage); // JSON with base64
router.post('/document/upload', upload.single('file'), messageController.sendDocumentMessageFormData); // Form data with file upload

// Utility endpoints
router.post('/analyze-base64', messageController.analyzeBase64File); // Analyze base64 file info
router.post('/convert-to-base64', upload.single('file'), messageController.convertFileToBase64);

// Logs endpoint
router.get('/logs', logController.getLogs);

// QR Code endpoints
router.get('/qr/status', qrController.getQRStatus);
router.get('/qr/image', qrController.getQRImage);
router.post('/qr/logout', qrController.logout);
router.post('/qr/regenerate', qrController.regenerateQR);
router.post('/qr/clear-auth', qrController.clearAuth);

module.exports = router;
