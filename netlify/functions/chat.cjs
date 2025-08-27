
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const rateLimitWindow = 15 * 1000; // 15 seconds
const ipTimestamps = new Map();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/chat', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const last = ipTimestamps.get(ip) || 0;
    if (now - last < rateLimitWindow) {
        return res.status(429).json({ error: 'Rate limit: Only 1 request per 15 seconds allowed. Please wait before sending another message.' });
    }
    ipTimestamps.set(ip, now);

    try {
        let { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request format.' });
        }

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

        const modelList = (process.env.OPENROUTER_MODELS).split(',').map(m => m.trim());
        const apiKey = process.env.OPENROUTER_API_KEY;
        const apiUrl = process.env.OPENROUTER_API_URL;

        if (messages && messages.length > 0) {
            const userMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
            if (userMsg) console.log('User query:', userMsg.content);
        }

        let dailyLimitHit = false;
        for (const model of modelList) {
            try {
                console.log(`Trying model: ${model}`);
                const resp = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ model, messages }),
                });
                let data = null;
                try {
                    data = await resp.json();
                } catch (e) {
                    console.log(`Model ${model} response not JSON or error:`, e);
                    continue;
                }
                if (data?.error?.message && data.error.message.includes('Rate limit exceeded: free-models-per-day')) {
                    dailyLimitHit = true;
                    continue;
                }
                if (resp.ok && !data?.error) {
                    console.log(`Model ${model} response:`, JSON.stringify(data));
                    return res.status(200).json({ ...data, altModel: model });
                } else {
                    console.log(`Model ${model} failed:`, data?.error || resp.status);
                }
            } catch (e) {
                console.log(`Error with model ${model}:`, e);
            }
        }

        if (dailyLimitHit) {
            return res.status(429).json({ error: 'Daily limit exhausted. Try again after 24 hours.' });
        }

        return res.status(502).json({ error: 'All model requests failed.' });
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
});

module.exports.handler = serverless(app);