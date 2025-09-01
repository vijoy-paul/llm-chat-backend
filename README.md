LLM Backend (Netlify Serverless)

This backend is deployed as Netlify serverless functions using Express.js. It handles chat requests and can be extended with additional endpoints.

Features

Serverless deployment with Netlify

Express.js-based API

Easy local development and testing

Health check endpoint

Setup & Run Locally

Install dependencies

npm install


Create a .env file (see example .env.example) with your OpenRouter API key and site info:

/.netlify/functions/chat/health	GET	Health check to confirm the backend is running
{

# LLM Backend (Netlify Serverless)

This backend is deployed as Netlify serverless functions using Express.js. It handles chat requests and can be extended with additional endpoints.

## Features

- Serverless deployment with Netlify
- Express.js-based API
- Easy local development and testing
- Health check endpoint

---


## Environment Variables

Create a `.env` file in your project root with the following variables:

| Variable              | Description                                      | Example Value                  |
|-----------------------|--------------------------------------------------|-------------------------------|
| `OPENROUTER_API_KEY`  | Your OpenRouter API key                          | `sk-...`                      |
| `OPENROUTER_MODELS`   | Comma-separated list of model names to use        | `openai/gpt-3.5, mistral/7b`  |
| `OPENROUTER_API_URL`  | OpenRouter API endpoint URL                      | `https://openrouter.ai/api/v1`|
| `SYSTEM_PROMPT`       | (Optional) System prompt for the LLM persona     | `You are a helpful assistant.`|
| `BACKEND_URL`         | The base URL of your backend                     | `https://your-backend.netlify.app` |
| `NODE_ENV`            | Environment mode (development/production)        | `production`                  |
| `ALLOWED_ORIGINS`     | Comma-separated list of allowed CORS origins     | `https://yourdomain.com`      |
| `SITE_URL`            | (Optional) The base URL of your site             | `https://yourdomain.com`      |
| `SITE_TITLE`          | (Optional) Site title for display                | `My LLM Chatbot`              |

> All variables are required unless marked as optional. Set these in your Netlify dashboard for production deployment.

### Security Configuration

For production deployment, make sure to:
- Set `NODE_ENV=production`
- Configure `ALLOWED_ORIGINS` with your actual domain(s)
- Keep your API keys secure and never commit them to version control

---

## Setup & Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create a `.env` file** (see example `.env.example`) with your OpenRouter API key and site info:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   SITE_URL=http://localhost:8888
   ```
3. **Install Netlify CLI** (if not installed):
   ```bash
   npm install -g netlify-cli
   ```
4. **Start the local Netlify dev server:**
   ```bash
   netlify dev
   ```

Your serverless functions will be available at:  
`http://localhost:8888/.netlify/functions/`

---

## API Endpoints

| Endpoint                                 | Method | Description                              |
|------------------------------------------|--------|------------------------------------------|
| `/.netlify/functions/chat/health`        | GET    | Health check to confirm backend is running|
| `/.netlify/functions/chat`               | POST   | Main chat endpoint                       |

### Chat API Request

**Endpoint:**
```
POST /.netlify/functions/chat
```

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi, how can I help you?" }
    // ...more messages
  ]
}
```

**messages** is an array of objects, each containing:
- `role`: "user", "assistant", or "system"
- `content`: string

**Response Example:**
```json
{
  "choices": [
    { "message": { "content": "I am a friendly LLM." } }
  ],
  "altModel": "<model-used>"
}
```

**Error Codes:**

- `400`: Invalid request format or message too long
- `429`: Rate limit or daily limit exceeded
- `502`: All model requests failed

---

## Deployment

1. Push your code to a Git repository.
2. Connect the repository to Netlify.
3. Netlify will automatically deploy your serverless backend.

> Functions are stored in `netlify/functions/` (currently `chat.cjs`).

---

## Security Features

This backend includes several security measures:

### Input Validation & Sanitization
- All user input is validated and sanitized
- XSS protection through content filtering
- Request size limits (1MB max)
- Message length limits (1000 characters max)

### Rate Limiting
- 100 requests per 15 minutes per IP address
- Built-in protection against abuse
- Proper error messages with retry information

### Security Headers
- Helmet.js for security headers
- Content Security Policy (CSP)
- CORS configuration with origin restrictions
- Compression for better performance

### Error Handling
- Secure error messages (no sensitive data exposure)
- Proper logging without exposing API keys
- Timeout protection for external API calls
- Graceful degradation when services are unavailable

### Environment Security
- Environment variable validation
- Secure API key handling
- Production vs development configurations

## Notes

- The old Express server is removed; all logic is now inside `chat.cjs`.
- You can extend `chat.cjs` to add more endpoints or custom logic as needed.
- Make sure environment variables are correctly set in Netlify for deployment.
- For production, always set `NODE_ENV=production` and configure `ALLOWED_ORIGINS`.