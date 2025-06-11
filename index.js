import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { checkTrademark } from './uspto.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve plugin manifest and spec files
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// Trademark checking endpoint
app.post('/check', async (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names)) {
    return res.status(400).json({ error: "Missing 'names' array." });
  }

  try {
    const results = await Promise.all(names.map(checkTrademark));
    res.json({ available: results.filter(r => r.isAvailable) });
  } catch (err) {
    console.error("Trademark check error:", err.message);
    res.status(500).json({ error: "Trademark check failed." });
  }
});

// GPT-4o powered name generation
app.post('/generate-names', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative brand strategist for restaurants and bars."
          },
          {
            role: "user",
            content: `Generate 5 unique, memorable name ideas for this venue concept:\n\n"${prompt}"\n\nAvoid generic words like 'bar', 'grill', or 'cafe'. Return just the name ideas in a plain list.`
          }
        ],
        temperature: 0.8
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices?.[0]?.message?.content || "";
    console.log("GPT raw output:\n", raw); // ✅ Debug log

    // Robust line cleanup
    const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const names = lines.filter(line => /^[A-Za-z0-9\s\-\&']{3,}$/.test(line));

    res.json({ names });
  } catch (err) {
    console.error("OpenAI API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate names" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
