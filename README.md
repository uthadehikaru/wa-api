# Whisper API

A RESTful WhatsApp messaging API built with Express.js and Baileys library for seamless WhatsApp integration.

## Features

- 🏓 **Ping/Pong** - Health check endpoint
- 📊 **Status Check** - WhatsApp connection status monitoring
- 📨 **Send Message** - Send text messages to personal chats
- 👥 **Send Group Message** - Send messages to WhatsApp groups
- 📋 **Logging** - Comprehensive logging for all activities
- 🔧 **Modular Structure** - Clean, maintainable, and scalable code structure

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ibnusyawall/whisper-api.git
cd whisper-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### 1. Health Check
**GET** `/api/v1/ping`

Check if the service is running properly.

**Response:**
```json
{
  "success": true,
  "message": "pong",
  "service": "Whisper API",
  "status": "alive",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "responseTime": "5ms"
}
```

### 2. Connection Status
**GET** `/api/v1/status`

Check WhatsApp connection status (connected/disconnected).

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "Whisper API",
    "connection": {
      "isConnected": true,
      "status": "connected",
      "qrAvailable": false
    },
    "baileys": {
      "version": "6.5.0",
      "isServiceAlive": true
    },
    "server": {
      "uptime": 3600,
      "timestamp": "2024-01-01T10:00:00.000Z",
      "nodeVersion": "v18.17.0"
    }
  }
}
```

### 3. Send Message
**POST** `/api/v1/message`

Send text message to a WhatsApp number.

**Request Body:**
```json
{
  "phoneNumber": "628123456789",
  "message": "Hello, this is a test message!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phoneNumber": "628123456789",
    "message": "Hello, this is a test message!",
    "status": "sent",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  "message": "Message sent successfully"
}
```

### 4. Send Group Message
**POST** `/api/v1/message/group`

Send message to a WhatsApp group.

**Request Body:**
```json
{
  "groupId": "120363042123456789@g.us",
  "message": "Hello group!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groupId": "120363042123456789@g.us",
    "message": "Hello group!",
    "status": "sent",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  "message": "Group message sent successfully"
}
```

### 5. Get Logs
**GET** `/api/v1/logs`

Retrieve application activity logs.

**Query Parameters:**
- `limit` (optional): Number of logs to retrieve (default: 100, max: 1000)
- `level` (optional): Filter by log level (all, info, warn, error)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "level": "info",
        "message": "Message sent successfully to 628123456789",
        "timestamp": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 1,
    "limit": 100,
    "level": "all",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  "message": "Retrieved 1 log entries"
}
```

## First Time Setup

1. Start the server
2. Scan the QR code displayed in the terminal using WhatsApp on your phone
3. Check connection status using `/api/v1/status` endpoint
4. Start sending messages!

## Project Structure

```
src/
├── app.js                 # Main application file
├── routes/
│   └── index.js          # Route definitions
├── controllers/
│   ├── pingController.js # Health check handler
│   ├── statusController.js # Status check handler
│   ├── messageController.js # Message sending handler
│   └── logController.js  # Logging handler
├── services/
│   └── whatsappService.js # WhatsApp/Baileys service
└── utils/
    └── logger.js         # Winston logger utility

auth/                     # Baileys authentication files
logs/                     # Application logs
```

## Environment Variables

```bash
PORT=3000                 # Server port
NODE_ENV=production       # Environment mode
LOG_LEVEL=info           # Logging level
```

## Phone Number Format

- Format: `628123456789` (with country code 62 for Indonesia)
- Numbers starting with `0` will be automatically formatted
- Example: `08123456789` → `628123456789`

## Group ID Format

- Group IDs typically end with `@g.us`
- Example: `120363042123456789@g.us`
- Can be obtained from WhatsApp logs or other tools

## Logging

- Logs are stored in the `logs/` directory
- `app.log` - all application logs
- `error.log` - error logs only
- Automatic log rotation (5MB per file, max 10 files)

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

## Deployment

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Render
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Deploy

### VPS/Traditional Hosting
```bash
# Using PM2 for process management
npm install -g pm2
pm2 start src/app.js --name whisper-api
pm2 startup
pm2 save
```

## Usage Examples

### Using cURL

```bash
# Health check
curl -X GET http://localhost:3000/api/v1/ping

# Send message
curl -X POST http://localhost:3000/api/v1/message \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"628123456789","message":"Hello World!"}'

# Check status
curl -X GET http://localhost:3000/api/v1/status
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

// Send message
const sendMessage = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/message', {
      phoneNumber: '628123456789',
      message: 'Hello from Whisper API!'
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};
```

## Notes

- QR code only appears on first run or after logout
- WhatsApp session is stored in the `auth/` directory
- Don't delete the `auth/` folder to maintain session
- Service will automatically reconnect if disconnected
- Keep the server running to maintain WhatsApp connection

## Common Issues

### 1. QR Code not appearing
- Ensure no old session exists in the `auth/` folder
- Delete the `auth/` folder and restart the application

### 2. Message failed to send
- Check connection status at `/api/v1/status`
- Verify the phone number is correct and has WhatsApp
- Check logs for detailed error information

### 3. Service instability
- Ensure stable internet connection
- Check logs for error details
- Restart the service if necessary

### 4. Port already in use
- Change the PORT in `.env` file
- Kill existing processes: `lsof -ti:3000 | xargs kill -9`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is for educational and development purposes. Please ensure you comply with WhatsApp's Terms of Service when using this API.

## Support

If you found this project helpful, please give it a ⭐ star!

For issues and questions, please create an issue in the GitHub repository.
