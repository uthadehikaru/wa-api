const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const whatsappService = require('./services/whatsapp.service');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Custom morgan format with winston
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            logger.info(message.trim());
        }
    }
}));

// Routes
app.use('/api/v1', routes);

// QR Scanner page
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/qr/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Initialize WhatsApp service
whatsappService.initialize();

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📱 WhatsApp API server started`);
});

module.exports = app;
