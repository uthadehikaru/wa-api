const express = require('express');
const pingController = require('../controllers/ping.controller');
const statusController = require('../controllers/status.controller');
const messageController = require('../controllers/message.controller');
const logController = require('../controllers/log.controller');
const qrController = require('../controllers/qr.controller');

const router = express.Router();

// Health check / Ping endpoint
router.get('/ping', pingController.ping);

// Status check endpoint
router.get('/status', statusController.getStatus);

// Message endpoints
router.post('/message', messageController.sendPersonalMessage);
router.post('/message/group', messageController.sendGroupMessage);

// Logs endpoint
router.get('/logs', logController.getLogs);

// QR Code endpoints
router.get('/qr/status', qrController.getQRStatus);
router.get('/qr/image', qrController.getQRImage);
router.post('/qr/logout', qrController.logout);
router.post('/qr/regenerate', qrController.regenerateQR);
router.post('/qr/clear-auth', qrController.clearAuth);

module.exports = router;
