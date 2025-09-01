const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    },
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.get('*', (req, res) => {
  // Only return backend URL if it's configured
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return res.status(500).json({ 
      error: 'Backend URL not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({ 
    backend_url: backendUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports.handler = serverless(app);
