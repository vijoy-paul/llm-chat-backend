const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());

app.get('*', (req, res) => {
  res.json({ backend_url: process.env.BACKEND_URL });
});

module.exports.handler = serverless(app);
