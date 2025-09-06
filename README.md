# 🤖 LLM Chatbot Backend

A modern, secure, and scalable serverless backend for AI chatbots powered by **Google Gemini 2.0 Flash**. Built with Express.js and deployed on Netlify Functions.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- 🚀 **Serverless Architecture** - Deployed on Netlify Functions for automatic scaling
- 🧠 **Google Gemini 2.0 Flash** - Latest AI model for fast, accurate responses
- 🔒 **Enterprise Security** - Rate limiting, input validation, and CORS protection
- ⚡ **High Performance** - Optimized for speed with compression and caching
- 🛡️ **Production Ready** - Comprehensive error handling and monitoring
- 🔧 **Easy Development** - Local development with hot reloading
- 📊 **Health Monitoring** - Built-in health check endpoints

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  Netlify         │───▶│  Google Gemini  │
│   (React/Vue)   │    │  Functions       │    │  API            │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Express.js      │
                       │  Middleware      │
                       └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/llm-backend.git
   cd llm-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
   SYSTEM_PROMPT=You are a helpful AI assistant. Provide clear, concise, and accurate responses to user queries.
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Your API will be available at `http://localhost:8888/.netlify/functions/chat`

## 📚 API Documentation

### Base URL
```
Development: http://localhost:8888/.netlify/functions
Production:  https://your-site.netlify.app/.netlify/functions
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Main chat endpoint for AI conversations |
| `/health` | GET | Health check endpoint |

### Chat API

**Endpoint:** `POST /.netlify/functions/chat`

**Request Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant."
    },
    {
      "role": "user", 
      "content": "Hello! How are you today?"
    },
    {
      "role": "assistant",
      "content": "I'm doing well, thank you! How can I help you?"
    },
    {
      "role": "user",
      "content": "What's the weather like?"
    }
  ]
}
```

**Message Object:**
- `role`: `"user"` | `"assistant"` | `"system"`
- `content`: `string` (max 1000 characters)

**Success Response:**
```json
{
  "choices": [
    {
      "message": {
        "content": "I don't have access to real-time weather data, but I'd be happy to help you find weather information through other means!"
      }
    }
  ],
  "model": "gemini-2.0-flash",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| `400` | Invalid request format or message too long |
| `429` | Rate limit exceeded |
| `500` | Server configuration error |
| `502` | Gemini API request failed |
| `504` | Request timeout |

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key | `AIzaSy...` |
| `GEMINI_API_URL` | ❌ | Gemini API endpoint (has default) | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |
| `SYSTEM_PROMPT` | ❌ | Default system prompt | `You are a helpful AI assistant.` |
| `NODE_ENV` | ❌ | Environment mode | `production` |
| `ALLOWED_ORIGINS` | ❌ | CORS allowed origins (comma-separated) | `https://yourdomain.com,https://app.yourdomain.com` |

### Security Configuration

For production deployment:

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 🛡️ Security Features

### Input Validation & Sanitization
- ✅ XSS protection through content filtering
- ✅ Request size limits (1MB max)
- ✅ Message length validation (1000 characters max)
- ✅ SQL injection prevention
- ✅ Malicious content detection

### Rate Limiting
- ✅ 100 requests per 15 minutes per IP
- ✅ Configurable rate limits
- ✅ Proper error messages with retry information

### Security Headers
- ✅ Helmet.js security headers
- ✅ Content Security Policy (CSP)
- ✅ CORS with origin restrictions
- ✅ Compression for performance

### Error Handling
- ✅ Secure error messages (no sensitive data)
- ✅ Comprehensive logging
- ✅ Timeout protection (30s)
- ✅ Graceful degradation

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect your repository to Netlify**
2. **Set environment variables in Netlify dashboard:**
   ```
   GEMINI_API_KEY=your_production_api_key
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com
   ```
3. **Deploy automatically on git push**

### Manual Deployment

```bash
# Build and deploy
npm run build:functions
netlify deploy --prod
```

## 🧪 Testing

### Health Check
```bash
curl https://your-site.netlify.app/.netlify/functions/health
```

### Chat Test
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

## 📊 Monitoring

The backend includes built-in monitoring:

- **Health checks** for service availability
- **Request logging** for debugging
- **Error tracking** with timestamps
- **Performance metrics** for optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@yourdomain.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/llm-backend/issues)
- 📖 **Documentation**: [Wiki](https://github.com/yourusername/llm-backend/wiki)

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for the AI API
- [Netlify](https://netlify.com/) for serverless hosting
- [Express.js](https://expressjs.com/) for the web framework

---

<div align="center">
  <strong>Built with ❤️ for the AI community</strong>
</div>