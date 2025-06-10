import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkTrademark } from './uspto.js';

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

app.post('/check', async (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names)) {
    return res.status(400).json({ error: "Missing 'names' array." });
  }

  const results = await Promise.all(names.map(checkTrademark));
  res.json({ available: results.filter(r => r.isAvailable) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
