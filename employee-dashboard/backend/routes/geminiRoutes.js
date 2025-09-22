const express = require('express');
const fetch = require('node-fetch');

// Secure proxy to Google Generative Language API.
// Prevents exposing raw API key to the browser. Clients POST payload and server attaches key.
// Supports text and audio generation endpoints via :model path segment.

const router = express.Router();

// Basic rate limiting memory (lightweight) to further protect key (optional simple limiter)
const recent = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQ_PER_WINDOW = 60; // per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  if (!recent.has(ip)) recent.set(ip, []);
  const arr = recent.get(ip).filter(ts => now - ts < WINDOW_MS);
  arr.push(now);
  recent.set(ip, arr);
  if (arr.length > MAX_REQ_PER_WINDOW) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
}

router.post('/:model', rateLimit, async (req, res) => {
  try {
    const { model } = req.params;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    console.error('[Gemini Proxy Error]', err);
    res.status(500).json({ error: 'Gemini proxy failed', details: process.env.NODE_ENV === 'production' ? undefined : err.message });
  }
});

module.exports = router;
