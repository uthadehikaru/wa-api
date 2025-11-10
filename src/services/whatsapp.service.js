const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require('baileys');
const qrcode = require('qrcode-terminal');
const qrcodeImage = require('qrcode');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const packageJson = require('../../package.json');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.qrCode = null;
        this.authDir = path.join(__dirname, '../../auth');
        this.qrCodeDir = path.join(__dirname, '../../public/qr');
        this.qrCodePath = path.join(this.qrCodeDir, 'whatsapp-qr.png');
    }

    async initialize() {
        try {
            logger.debug('🔄 Initializing WhatsApp service...');

            // Create auth directory if it doesn't exist
            if (!fs.existsSync(this.authDir)) {
                fs.mkdirSync(this.authDir, { recursive: true });
            }

            // Create QR code directory if it doesn't exist
            if (!fs.existsSync(this.qrCodeDir)) {
                fs.mkdirSync(this.qrCodeDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version, isLatest } = await fetchLatestBaileysVersion();

            logger.debug(`📱 Using WA version ${version.join('.')}, isLatest: ${isLatest}`);

            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: logger
            });

            this.setupEventHandlers(saveCreds);

        } catch (error) {
            logger.error('❌ Error initializing WhatsApp service:', error);
            this.connectionStatus = 'error';
        }
    }

    setupEventHandlers(saveCreds) {
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.qrCode = qr;
                logger.debug('📱 QR Code generated. Scan to connect.');
                qrcode.generate(qr, { small: true });
                this.connectionStatus = 'qr_ready';
                
                // Generate and save QR code image
                try {
                    await qrcodeImage.toFile(this.qrCodePath, qr, {
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        },
                        width: 300,
                        margin: 2
                    });
                    logger.debug('📱 QR Code image saved successfully');
                } catch (error) {
                    logger.error('❌ Error saving QR code image:', error);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    logger.debug('🔄 Connection closed, reconnecting...');
                    this.connectionStatus = 'reconnecting';
                    this.isConnected = false;
                    this.initialize();
                } else {
                    logger.debug('🔓 Connection closed, logged out');
                    this.connectionStatus = 'logged_out';
                    this.isConnected = false;
                }
            } else if (connection === 'open') {
                logger.debug('✅ WhatsApp connection established');
                this.connectionStatus = 'connected';
                this.isConnected = true;
                this.qrCode = null;
            } else if (connection === 'connecting') {
                logger.debug('🔄 Connecting to WhatsApp...');
                this.connectionStatus = 'connecting';
            }
        });

        this.sock.ev.on('creds.update', saveCreds);
    }

    async sendMessage(phoneNumber, message) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp not connected');
            }

            // Format phone number (ensure it has country code)
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            if (!formattedNumber.startsWith('62')) {
                if (formattedNumber.startsWith('0')) {
                    formattedNumber = '62' + formattedNumber.substring(1);
                } else {
                    formattedNumber = '62' + formattedNumber;
                }
            }

            const jid = `${formattedNumber}@s.whatsapp.net`;

            logger.debug(`📤 Sending message to ${jid}: ${message}`);

            await this.sock.sendMessage(jid, { text: message });

            logger.debug(`✅ Message sent successfully to ${phoneNumber}`);
            return { success: true, message: 'Message sent successfully' };

        } catch (error) {
            logger.error('❌ Error sending message:', error);
            throw error;
        }
    }

    async sendGroupMessage(groupId, message) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp not connected');
            }

            // Group ID should end with @g.us
            const jid = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`;

            logger.debug(`📤 Sending group message to ${jid}: ${message}`);

            await this.sock.sendMessage(jid, { text: message });

            logger.debug(`✅ Group message sent successfully to ${groupId}`);
            return { success: true, message: 'Group message sent successfully' };

        } catch (error) {
            logger.error('❌ Error sending group message:', error);
            throw error;
        }
    }

    async sendDocumentMessage(phoneNumber, file, caption) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp not connected');
            }

            // Format phone number (ensure it has country code)
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            if (!formattedNumber.startsWith('62')) {
                if (formattedNumber.startsWith('0')) {
                    formattedNumber = '62' + formattedNumber.substring(1);
                } else {
                    formattedNumber = '62' + formattedNumber;
                }
            }

            const jid = `${formattedNumber}@s.whatsapp.net`;

            logger.debug(`📤 Sending document message to ${jid}: ${caption}`);

            // Handle different file input formats
            let documentData;
            if (Buffer.isBuffer(file)) {
                // If file is a Buffer (from base64), use default values
                documentData = {
                    document: file,
                    caption: caption,
                    mimetype: 'application/octet-stream',
                    fileName: 'document'
                };
            } else if (file && file.buffer) {
                // If file is an object with buffer property (from multer)
                documentData = {
                    document: file.buffer,
                    caption: caption,
                    mimetype: file.mimetype || 'application/octet-stream',
                    fileName: file.originalname || 'document'
                };
            } else {
                throw new Error('Invalid file format provided');
            }

            await this.sock.sendMessage(jid, documentData);

            logger.debug(`✅ Document message sent successfully to ${phoneNumber}`);
            return { success: true, message: 'Document message sent successfully' };

        } catch (error) {
            logger.error('❌ Error sending message:', error);
            throw error;
        }
    }

    async sendImageMessage(phoneNumber, file, caption) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp not connected');
            }

            // Format phone number (ensure it has country code)
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            if (!formattedNumber.startsWith('62')) {
                if (formattedNumber.startsWith('0')) {
                    formattedNumber = '62' + formattedNumber.substring(1);
                } else {
                    formattedNumber = '62' + formattedNumber;
                }
            }

            const jid = `${formattedNumber}@s.whatsapp.net`;

            logger.debug(`📤 Sending image message to ${jid}: ${caption || 'no caption'}`);

            // Handle different file input formats
            let imageData;
            if (Buffer.isBuffer(file)) {
                // If file is a Buffer (from base64), use default values
                imageData = {
                    image: file,
                    caption: caption,
                    mimetype: 'image/jpeg'
                };
            } else if (file && file.buffer) {
                // If file is an object with buffer property (from multer)
                imageData = {
                    image: file.buffer,
                    caption: caption,
                    mimetype: file.mimetype || 'image/jpeg'
                };
            } else {
                throw new Error('Invalid file format provided');
            }

            await this.sock.sendMessage(jid, imageData);

            logger.debug(`✅ Image message sent successfully to ${phoneNumber}`);
            return { success: true, message: 'Image message sent successfully' };

        } catch (error) {
            logger.error('❌ Error sending image message:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionStatus: this.connectionStatus,
            qrCode: this.qrCode,
            qrCodeImagePath: this.connectionStatus === 'qr_ready' ? '/api/v1/qr/image' : null,
            timestamp: new Date().toISOString()
        };
    }

    getQRCodeImagePath() {
        return this.qrCodePath;
    }

    hasQRCodeImage() {
        return fs.existsSync(this.qrCodePath);
    }

    async logout() {
        try {
            if (this.sock && this.isConnected) {
                logger.debug('🔓 Logging out from WhatsApp...');
                await this.sock.logout();
                this.connectionStatus = 'logged_out';
                this.isConnected = false;
                this.qrCode = null;
                
                // Remove QR code image if exists
                if (this.hasQRCodeImage()) {
                    fs.unlinkSync(this.qrCodePath);
                    logger.debug('🗑️ QR code image removed');
                }
                
                logger.debug('✅ Logout successful');
                return { success: true, message: 'Logout successful' };
            } else {
                logger.warn('⚠️ No active connection to logout from');
                return { success: false, message: 'No active connection' };
            }
        } catch (error) {
            logger.error('❌ Error during logout:', error);
            throw error;
        }
    }

    async regenerateQR() {
        try {
            logger.debug('🔄 Regenerating QR code...');
            
            // First logout if connected
            if (this.isConnected) {
                await this.logout();
            }
            
            // Clear any existing QR code
            this.qrCode = null;
            if (this.hasQRCodeImage()) {
                fs.unlinkSync(this.qrCodePath);
            }
            
            // Reset connection status
            this.connectionStatus = 'disconnected';
            this.isConnected = false;
            
            // Reinitialize the service
            await this.initialize();
            
            logger.debug('✅ QR code regeneration initiated');
            return { success: true, message: 'QR code regeneration initiated' };
            
        } catch (error) {
            logger.error('❌ Error regenerating QR code:', error);
            throw error;
        }
    }

    async clearAuth() {
        try {
            logger.debug('🗑️ Clearing authentication data...');
            
            // Logout first if connected
            if (this.isConnected) {
                await this.logout();
            }
            
            // Remove auth directory contents
            if (fs.existsSync(this.authDir)) {
                const files = fs.readdirSync(this.authDir);
                for (const file of files) {
                    const filePath = path.join(this.authDir, file);
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                }
                logger.debug('🗑️ Authentication files cleared');
            }
            
            // Remove QR code image
            if (this.hasQRCodeImage()) {
                fs.unlinkSync(this.qrCodePath);
                logger.debug('🗑️ QR code image removed');
            }
            
            // Reset state
            this.qrCode = null;
            this.connectionStatus = 'disconnected';
            this.isConnected = false;
            
            // Reinitialize
            await this.initialize();
            
            logger.debug('✅ Authentication cleared and service reinitialized');
            return { success: true, message: 'Authentication cleared successfully' };
            
        } catch (error) {
            logger.error('❌ Error clearing authentication:', error);
            throw error;
        }
    }

    isServiceAlive() {
        return this.sock !== null;
    }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
