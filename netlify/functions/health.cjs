// health.cjs
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
app.use(cors());


app.get('*', (req, res) => {
    res.send('<h1>Health OK</h1>');
});

module.exports.handler = serverless(app);
