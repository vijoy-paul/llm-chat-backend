// health.cjs
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
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
    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    };
    
    res.json(healthData);
});

module.exports.handler = serverless(app);
