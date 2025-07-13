const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require('baileys');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const path = require('path');
const packageJson = require('../../package.json');

// import plugins syncronously
const { antiGroupMention } = require('../plugins/anti-mention.plugin')

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.qrCode = null;
        this.authDir = path.join(__dirname, '../../auth');
    }

    async initialize() {
        try {
            logger.info('🔄 Initializing WhatsApp service...');

            // Create auth directory if it doesn't exist
            const fs = require('fs');
            if (!fs.existsSync(this.authDir)) {
                fs.mkdirSync(this.authDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            const { version, isLatest } = await fetchLatestBaileysVersion();

            logger.info(`📱 Using WA version ${version.join('.')}, isLatest: ${isLatest}`);

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
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.qrCode = qr;
                logger.info('📱 QR Code generated. Scan to connect.');
                qrcode.generate(qr, { small: true });
                this.connectionStatus = 'qr_ready';
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    logger.info('🔄 Connection closed, reconnecting...');
                    this.connectionStatus = 'reconnecting';
                    this.isConnected = false;
                    this.initialize();
                } else {
                    logger.info('🔓 Connection closed, logged out');
                    this.connectionStatus = 'logged_out';
                    this.isConnected = false;
                }
            } else if (connection === 'open') {
                logger.info('✅ WhatsApp connection established');
                this.connectionStatus = 'connected';
                this.isConnected = true;
                this.qrCode = null;
            } else if (connection === 'connecting') {
                logger.info('🔄 Connecting to WhatsApp...');
                this.connectionStatus = 'connecting';
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('messages.upsert', (m) => {
            const messages = m.messages;
            if (messages && messages.length > 0) {
                let message = messages[0];
                antiGroupMention(this.sock, message);
                console.info('Received messages: ', JSON.stringify(message, 2, null))

                logger.debug('📨 Received messages:', messages.length);
            }
        });
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

            logger.info(`📤 Sending message to ${jid}: ${message}`);

            // please do-not remove watermark! 
            message += `\n\n> Sent via ${(s => s[0].toUpperCase() + s.slice(1, s.indexOf('-')))(packageJson.name)}\n> @${packageJson.author}/${packageJson.name}.git`;

            await this.sock.sendMessage(jid, { text: message });

            logger.info(`✅ Message sent successfully to ${phoneNumber}`);
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

            logger.info(`📤 Sending group message to ${jid}: ${message}`);

            // please do-not remove watermark! 
            message += `\n\n> Sent via ${(s => s[0].toUpperCase() + s.slice(1, s.indexOf('-')))(packageJson.name)}\n> @${packageJson.author}/${packageJson.name}.git`;

            await this.sock.sendMessage(jid, { text: message });

            logger.info(`✅ Group message sent successfully to ${groupId}`);
            return { success: true, message: 'Group message sent successfully' };

        } catch (error) {
            logger.error('❌ Error sending group message:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionStatus: this.connectionStatus,
            qrCode: this.qrCode,
            timestamp: new Date().toISOString()
        };
    }

    isServiceAlive() {
        return this.sock !== null;
    }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
