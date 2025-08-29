const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using API token
 * Expects token in Authorization header: Bearer <token>
 * or in X-API-Token header
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiToken = req.headers['x-api-token'];
    
    // Get token from environment variable
    const expectedToken = process.env.API_TOKEN;
    
    if (!expectedToken) {
        logger.error('API_TOKEN not configured in environment variables');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'API token not configured'
        });
    }
    
    // Extract token from Authorization header (Bearer token)
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (apiToken) {
        // Fallback to X-API-Token header
        token = apiToken;
    }
    
    if (!token) {
        logger.warn(`Unauthorized access attempt from ${req.ip} - No token provided`);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'API token is required. Include it in Authorization header (Bearer <token>) or X-API-Token header'
        });
    }
    
    if (token !== expectedToken) {
        logger.warn(`Unauthorized access attempt from ${req.ip} - Invalid token`);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid API token'
        });
    }
    
    // Token is valid, proceed to next middleware
    logger.debug(`Authenticated request from ${req.ip}`);
    next();
};

module.exports = {
    authenticateToken
};
