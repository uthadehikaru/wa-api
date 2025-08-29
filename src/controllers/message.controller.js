const logger = require('../utils/logger');
const whatsappService = require('../services/whatsapp.service');

// Utility function to extract file info from base64
const extractFileInfoFromBase64 = (base64String) => {
    try {
        // Check if it's a data URL
        if (base64String.startsWith('data:')) {
            const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                const mimetype = matches[1];
                const base64Data = matches[2];
                
                // Try to extract filename from mimetype if it contains it
                let filename = 'document';
                if (mimetype.includes('filename=')) {
                    const filenameMatch = mimetype.match(/filename="([^"]+)"/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }
                
                return {
                    mimetype,
                    filename,
                    base64Data,
                    buffer: Buffer.from(base64Data, 'base64')
                };
            }
        }
        
        // If it's just base64 data, we can't determine mimetype/filename
        return {
            mimetype: 'application/octet-stream',
            filename: 'document',
            base64Data: base64String,
            buffer: Buffer.from(base64String, 'base64')
        };
    } catch (error) {
        logger.error('Error extracting file info from base64:', error);
        throw new Error('Invalid base64 format');
    }
};

const messageController = {
    sendPersonalMessage: async (req, res) => {
        try {
            const { phoneNumber, message } = req.body;

            logger.debug(`📨 Send message request received for ${phoneNumber}`);

            // Validation
            if (!phoneNumber || !message) {
                logger.warn('❌ Missing required fields: phoneNumber or message');
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'phoneNumber and message are required'
                });
            }

            if (typeof message !== 'string' || message.trim() === '') {
                logger.warn('❌ Invalid message format');
                return res.status(400).json({
                    success: false,
                    error: 'Invalid message format',
                    message: 'Message must be a non-empty string'
                });
            }

            // Check if WhatsApp is connected
            if (!whatsappService.isConnected) {
                logger.warn('❌ WhatsApp not connected');
                return res.status(503).json({
                    success: false,
                    error: 'Service unavailable',
                    message: 'WhatsApp is not connected. Please check connection status.'
                });
            }

            // Send message
            const result = await whatsappService.sendMessage(phoneNumber, message.trim());

            logger.debug(`✅ Message sent successfully to ${phoneNumber}`);

            const response = {
                success: true,
                data: {
                    phoneNumber,
                    message: message.trim(),
                    status: 'sent',
                    timestamp: new Date().toISOString()
                },
                message: result.message
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in send message controller:', error);

            const response = {
                success: false,
                error: 'Failed to send message',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    sendGroupMessage: async (req, res) => {
        try {
            const { groupId, message } = req.body;

            logger.debug(`📨 Send group message request received for ${groupId}`);

            // Validation
            if (!groupId || !message) {
                logger.warn('❌ Missing required fields: groupId or message');
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'groupId and message are required'
                });
            }

            if (typeof message !== 'string' || message.trim() === '') {
                logger.warn('❌ Invalid message format');
                return res.status(400).json({
                    success: false,
                    error: 'Invalid message format',
                    message: 'Message must be a non-empty string'
                });
            }

            // Check if WhatsApp is connected
            if (!whatsappService.isConnected) {
                logger.warn('❌ WhatsApp not connected');
                return res.status(503).json({
                    success: false,
                    error: 'Service unavailable',
                    message: 'WhatsApp is not connected. Please check connection status.'
                });
            }

            // Send group message
            const result = await whatsappService.sendGroupMessage(groupId, message.trim());

            logger.debug(`✅ Group message sent successfully to ${groupId}`);

            const response = {
                success: true,
                data: {
                    groupId,
                    message: message.trim(),
                    status: 'sent',
                    timestamp: new Date().toISOString()
                },
                message: result.message
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in send group message controller:', error);

            const response = {
                success: false,
                error: 'Failed to send group message',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    sendDocumentMessage: async (req, res) => {
        try {
            const { phoneNumber, file, caption, filename, mimetype } = req.body;

            logger.debug(`📨 Send document message request received for ${phoneNumber}`);

            // Validation
            if (!phoneNumber || !file) {
                logger.warn('❌ Missing required fields: phoneNumber or file');
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'phoneNumber and file are required'
                });
            }

            // Check if WhatsApp is connected
            if (!whatsappService.isConnected) {
                logger.warn('❌ WhatsApp not connected');
                return res.status(503).json({
                    success: false,
                    error: 'Service unavailable',
                    message: 'WhatsApp is not connected. Please check connection status.'
                });
            }

            // Extract file info from base64
            const fileInfo = extractFileInfoFromBase64(file);
            
            // Use provided filename/mimetype if available, otherwise use extracted ones
            const finalFilename = filename || fileInfo.filename;
            const finalMimetype = mimetype || fileInfo.mimetype;

            logger.debug(`📄 File info: ${finalFilename} (${finalMimetype})`);

            // Send document message with file info
            const result = await whatsappService.sendDocumentMessage(phoneNumber, {
                buffer: fileInfo.buffer,
                mimetype: finalMimetype,
                originalname: finalFilename
            }, caption);

            logger.debug(`✅ Document message sent successfully to ${phoneNumber}`);

            const response = {
                success: true,
                data: {
                    phoneNumber,
                    filename: finalFilename,
                    mimetype: finalMimetype,
                    fileSize: fileInfo.buffer.length,
                    caption,
                    status: 'sent',
                    timestamp: new Date().toISOString()
                },
                message: result.message
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in send document message controller:', error);

            const response = {
                success: false,
                error: 'Failed to send message',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    // Utility endpoint to analyze base64 file
    analyzeBase64File: async (req, res) => {
        try {
            const { file } = req.body;

            if (!file) {
                logger.warn('❌ No file provided');
                return res.status(400).json({
                    success: false,
                    error: 'No file provided',
                    message: 'Please provide a base64 file to analyze'
                });
            }

            // Extract file info from base64
            const fileInfo = extractFileInfoFromBase64(file);

            logger.debug(`✅ Base64 file analyzed successfully`);

            const response = {
                success: true,
                data: {
                    filename: fileInfo.filename,
                    mimetype: fileInfo.mimetype,
                    fileSize: fileInfo.buffer.length,
                    isDataUrl: file.startsWith('data:'),
                    timestamp: new Date().toISOString()
                },
                message: 'Base64 file analyzed successfully'
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error analyzing base64 file:', error);

            const response = {
                success: false,
                error: 'Failed to analyze base64 file',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    // Utility endpoint to analyze base64 file
    analyzeBase64File: async (req, res) => {
        try {
            const { file } = req.body;

            if (!file) {
                logger.warn('❌ No file provided');
                return res.status(400).json({
                    success: false,
                    error: 'No file provided',
                    message: 'Please provide a base64 file to analyze'
                });
            }

            // Extract file info from base64
            const fileInfo = extractFileInfoFromBase64(file);

            logger.debug(`✅ Base64 file analyzed successfully`);

            const response = {
                success: true,
                data: {
                    filename: fileInfo.filename,
                    mimetype: fileInfo.mimetype,
                    fileSize: fileInfo.buffer.length,
                    isDataUrl: file.startsWith('data:'),
                    timestamp: new Date().toISOString()
                },
                message: 'Base64 file analyzed successfully'
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error analyzing base64 file:', error);

            const response = {
                success: false,
                error: 'Failed to analyze base64 file',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    // New function to handle multipart form data with file upload
    sendDocumentMessageFormData: async (req, res) => {
        try {
            const { phoneNumber, caption } = req.body;
            const uploadedFile = req.file;

            logger.debug(`📨 Send document message (form data) request received for ${phoneNumber}`);

            // Validation
            if (!phoneNumber || !uploadedFile) {
                logger.warn('❌ Missing required fields: phoneNumber or file');
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'phoneNumber and file are required'
                });
            }

            // Check if WhatsApp is connected
            if (!whatsappService.isConnected) {
                logger.warn('❌ WhatsApp not connected');
                return res.status(503).json({
                    success: false,
                    error: 'Service unavailable',
                    message: 'WhatsApp is not connected. Please check connection status.'
                });
            }

            // Create a file object that matches what the WhatsApp service expects
            const fileObject = {
                buffer: uploadedFile.buffer,
                mimetype: uploadedFile.mimetype,
                originalname: uploadedFile.originalname
            };
            
            // Send document message using the properly formatted file object
            const result = await whatsappService.sendDocumentMessage(phoneNumber, fileObject, caption);

            logger.debug(`✅ Document message (form data) sent successfully to ${phoneNumber}`);

            const response = {
                success: true,
                data: {
                    phoneNumber,
                    fileName: uploadedFile.originalname,
                    fileSize: uploadedFile.size,
                    mimeType: uploadedFile.mimetype,
                    caption,
                    status: 'sent',
                    timestamp: new Date().toISOString()
                },
                message: result.message
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error in send document message (form data) controller:', error);

            const response = {
                success: false,
                error: 'Failed to send message',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    },

    // Utility function to convert file to base64
    convertFileToBase64: async (req, res) => {
        try {
            const uploadedFile = req.file;

            if (!uploadedFile) {
                logger.warn('❌ No file uploaded');
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    message: 'Please upload a file to convert to base64'
                });
            }

            // Convert file buffer to base64
            const fileBase64 = uploadedFile.buffer.toString('base64');

            logger.debug(`✅ File converted to base64 successfully`);

            const response = {
                success: true,
                data: {
                    fileName: uploadedFile.originalname,
                    fileSize: uploadedFile.size,
                    mimeType: uploadedFile.mimetype,
                    base64: fileBase64,
                    timestamp: new Date().toISOString()
                },
                message: 'File converted to base64 successfully'
            };

            res.status(200).json(response);

        } catch (error) {
            logger.error('❌ Error converting file to base64:', error);

            const response = {
                success: false,
                error: 'Failed to convert file to base64',
                message: error.message,
                timestamp: new Date().toISOString()
            };

            res.status(500).json(response);
        }
    }
};

module.exports = messageController;
