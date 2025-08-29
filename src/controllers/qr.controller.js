const logger = require('../utils/logger');
const whatsappService = require('../services/whatsapp.service');
const path = require('path');
const fs = require('fs');

const qrController = {
    getQRImage: async (req, res) => {
        try {
            logger.debug('📱 QR Code image request received');

            const status = whatsappService.getStatus();
            
            if (status.connectionStatus !== 'qr_ready') {
                return res.status(404).json({
                    success: false,
                    error: 'QR Code not available',
                    message: 'WhatsApp is not in QR code generation state'
                });
            }

            if (!whatsappService.hasQRCodeImage()) {
                return res.status(404).json({
                    success: false,
                    error: 'QR Code image not found',
                    message: 'QR Code image file does not exist'
                });
            }

            const qrImagePath = whatsappService.getQRCodeImagePath();
            
            // Check if base64 format is requested
            if (req.query.format === 'base64') {
                return qrController.getQRImageBase64(req, res);
            }
            
            // Set appropriate headers for image
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            // Stream the image file
            const stream = fs.createReadStream(qrImagePath);
            stream.pipe(res);

            logger.debug('📱 QR Code image served successfully');

        } catch (error) {
            logger.error('❌ Error serving QR code image:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to serve QR code image',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    },

    getQRImageBase64: async (req, res) => {
        try {
            logger.debug('📱 QR Code base64 image request received');

            const status = whatsappService.getStatus();
            
            if (status.connectionStatus !== 'qr_ready') {
                return res.status(404).json({
                    success: false,
                    error: 'QR Code not available',
                    message: 'WhatsApp is not in QR code generation state'
                });
            }

            if (!whatsappService.hasQRCodeImage()) {
                return res.status(404).json({
                    success: false,
                    error: 'QR Code image not found',
                    message: 'QR Code image file does not exist'
                });
            }

            const qrImagePath = whatsappService.getQRCodeImagePath();
            
            // Read the image file and convert to base64
            const imageBuffer = fs.readFileSync(qrImagePath);
            const base64Image = imageBuffer.toString('base64');
            
            // Create data URL
            const dataUrl = `data:image/png;base64,${base64Image}`;
            
            const response = {
                success: true,
                data: {
                    qrCodeBase64: base64Image,
                    qrCodeDataUrl: dataUrl,
                    imageType: 'image/png',
                    timestamp: new Date().toISOString()
                }
            };

            logger.debug('📱 QR Code base64 image served successfully');

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error serving QR code base64 image:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to serve QR code base64 image',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    },

    getQRStatus: async (req, res) => {
        try {
            logger.debug('📱 QR Code status request received');

            const status = whatsappService.getStatus();
            
            const response = {
                success: true,
                data: {
                    qrAvailable: status.connectionStatus === 'qr_ready',
                    connectionStatus: status.connectionStatus,
                    qrCodeImageUrl: status.qrCodeImagePath,
                    timestamp: status.timestamp
                }
            };

            logger.debug(`📱 QR Status response: ${status.connectionStatus}, QR Available: ${response.data.qrAvailable}`);

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in QR status controller:', error);

            const response = {
                success: false,
                error: 'Failed to get QR status',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    logout: async (req, res) => {
        try {
            logger.debug('🔓 Logout request received');

            const result = await whatsappService.logout();
            
            const response = {
                success: result.success,
                data: {
                    message: result.message,
                    connectionStatus: whatsappService.getStatus().connectionStatus,
                    timestamp: new Date().toISOString()
                }
            };

            logger.debug(`🔓 Logout response: ${result.message}`);

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in logout controller:', error);

            const response = {
                success: false,
                error: 'Failed to logout',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    regenerateQR: async (req, res) => {
        try {
            logger.debug('🔄 QR code regeneration request received');

            const result = await whatsappService.regenerateQR();
            
            const response = {
                success: result.success,
                data: {
                    message: result.message,
                    connectionStatus: whatsappService.getStatus().connectionStatus,
                    timestamp: new Date().toISOString()
                }
            };

            logger.debug(`🔄 QR regeneration response: ${result.message}`);

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in QR regeneration controller:', error);

            const response = {
                success: false,
                error: 'Failed to regenerate QR code',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    clearAuth: async (req, res) => {
        try {
            logger.debug('🗑️ Clear authentication request received');

            const result = await whatsappService.clearAuth();
            
            const response = {
                success: result.success,
                data: {
                    message: result.message,
                    connectionStatus: whatsappService.getStatus().connectionStatus,
                    timestamp: new Date().toISOString()
                }
            };

            logger.debug(`🗑️ Clear auth response: ${result.message}`);

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in clear auth controller:', error);

            const response = {
                success: false,
                error: 'Failed to clear authentication',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    }
};

module.exports = qrController; 