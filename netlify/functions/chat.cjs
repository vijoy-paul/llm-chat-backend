
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const compression = require('compression');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing with size limits
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    // Additional validation can be added here
    if (buf.length > 1024 * 1024) { // 1MB limit
      throw new Error('Request body too large');
    }
  }
}));

// Input validation middleware
const validateChatRequest = [
  body('messages')
    .isArray({ min: 1, max: 50 })
    .withMessage('Messages must be an array with 1-50 items'),
  body('messages.*.role')
    .isIn(['user', 'assistant', 'system'])
    .withMessage('Invalid message role'),
  body('messages.*.content')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be a string between 1-1000 characters')
    .custom((value) => {
      // Basic XSS protection
      if (typeof value === 'string' && /<script|javascript:|data:/i.test(value)) {
        throw new Error('Potentially malicious content detected');
      }
      return true;
    })
];

// Sanitize input function
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

app.post('*', validateChatRequest, async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array().map(err => err.msg)
        });
    }

    try {
        let { messages } = req.body;
        
        // Sanitize all message content
        messages = messages.map(msg => ({
            ...msg,
            content: sanitizeInput(msg.content)
        }));

  const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user' && lastMsg.content) {
            const content = lastMsg.content.toLowerCase();
            if (/\b(who (are|made|created|built) (you|this)|what(('|’)?s| is) your (name|origin|model|provider|architecture|purpose|identity)|where (are|do) (you|this) (come|from)|are you (openai|chatgpt|gpt|llama|anthropic|claude|google|gemini|mistral|ai21|cohere|qwen|zhipu|zero|perplexity|llm|an ai|a language model|an llm|an artificial intelligence|an assistant)|who is your (creator|provider|developer|author|team|company|organization|maker|parent)|what model (are|is) (this|you)|what ai (are|is) (this|you)|what is your (training|source|dataset|release|version|type|platform|framework|engine|backend|api)|who trained you|who owns you|who operates you|who maintains you|who supports you|who funds you|who designed you|who controls you|who manages you|who supervises you|who is responsible for you|who invented you|who released you|who published you|who launched you|who built this|who is behind you|who is behind this|what company are you|what company is this|what company built you|what company made you|what company created you|what company owns you|what company operates you|what company maintains you|what company supports you|what company funds you|what company designed you|what company controls you|what company manages you|what company supervises you|what company is responsible for you|what company invented you|what company released you|what company published you|what company launched you|what organization are you|what organization is this|what organization built you|what organization made you|what organization created you|what organization owns you|what organization operates you|what organization maintains you|what organization supports you|what organization funds you|what organization designed you|what organization controls you|what organization manages you|what organization supervises you|what organization is responsible for you|what organization invented you|what organization released you|what organization published you|what organization launched you|what is your company|what is your organization|what is your model|what is your ai|what is your provider|what is your architecture|what is your backend|what is your api|what is your engine|what is your framework|what is your platform|what is your type|what is your version|what is your release|what is your source|what is your dataset|what is your training|what is your identity|what is your purpose|what is your name|are you a robot|are you a bot|are you an ai|are you an assistant|are you a language model|are you an llm|are you artificial intelligence|are you a neural network|are you a machine|are you a computer|are you a program|are you a software|are you a system|are you a tool|are you a product|are you a service|are you a solution|are you a technology|are you a platform|are you a framework|are you a backend|are you an api|are you an engine|are you a model|are you a version|are you a release|are you a source|are you a dataset|are you a training|are you an identity|are you a purpose|are you a name|are you openai|are you chatgpt|are you gpt|are you llama|are you anthropic|are you claude|are you google|are you gemini|are you mistral|are you ai21|are you cohere|are you qwen|are you zhipu|are you zero|are you perplexity|are you llm)\b/.test(content)) {
                return res.status(200).json({
                    choices: [
                        { message: { content: 'I am a friendly LLM.' } }
                    ]
                });
            }
        }

        const systemPrompt = {
            role: 'system',
            content: process.env.SYSTEM_PROMPT
        };
        if (!messages.length || messages[0].role !== 'system') {
            messages = [systemPrompt, ...messages];
        }

        if (lastMsg && lastMsg.content && lastMsg.content.length > 1000) {
            return res.status(400).json({ error: 'Message too long (max 1000 characters).' });
        }

        // Validate environment variables
        const modelList = process.env.OPENROUTER_MODELS?.split(',').map(m => m.trim()).filter(Boolean);
        const apiKey = process.env.OPENROUTER_API_KEY;
        const apiUrl = process.env.OPENROUTER_API_URL;

        if (!modelList || modelList.length === 0) {
            console.error('No models configured');
            return res.status(500).json({ error: 'Service configuration error' });
        }

        if (!apiKey || !apiUrl) {
            console.error('Missing API configuration');
            return res.status(500).json({ error: 'Service configuration error' });
        }

        // Log user query (sanitized) for debugging
        if (messages && messages.length > 0) {
            const userMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
            if (userMsg) {
                console.log('User query (sanitized):', sanitizeInput(userMsg.content).substring(0, 100));
            }
        }

        let dailyLimitHit = false;
        let lastError = null;
        
        for (const model of modelList) {
            try {
                console.log(`Trying model: ${model}`);
                
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const resp = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'LLM-Backend/1.0.0'
                    },
                    body: JSON.stringify({ model, messages }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                let data = null;
                try {
                    data = await resp.json();
                } catch (e) {
                    console.error(`Model ${model} response not JSON:`, e.message);
                    lastError = `Invalid response from ${model}`;
                    continue;
                }
                
                if (data?.error?.message && data.error.message.includes('Rate limit exceeded: free-models-per-day')) {
                    dailyLimitHit = true;
                    console.warn(`Daily limit hit for model: ${model}`);
                    continue;
                }
                
                if (resp.ok && !data?.error) {
                    console.log(`Model ${model} success`);
                    return res.status(200).json({ 
                        ...data, 
                        altModel: model,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    const errorMsg = data?.error?.message || `HTTP ${resp.status}`;
                    console.error(`Model ${model} failed:`, errorMsg);
                    lastError = errorMsg;
                }
            } catch (e) {
                if (e.name === 'AbortError') {
                    console.error(`Model ${model} timeout`);
                    lastError = `Request timeout for ${model}`;
                } else {
                    console.error(`Error with model ${model}:`, e.message);
                    lastError = e.message;
                }
            }
        }

        if (dailyLimitHit) {
            return res.status(429).json({ 
                error: 'Daily limit exhausted. Try again after 24 hours.',
                retryAfter: '24 hours'
            });
        }

        return res.status(502).json({ 
            error: 'All model requests failed.',
            details: lastError || 'Unknown error',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports.handler = serverless(app);