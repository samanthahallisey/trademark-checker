import express from 'express';
import dotenv from 'dotenv';
import { checkTrademark } from './uspto.js';

dotenv.config();
const app = express();
app.use(express.json());

app.post('/check', async (req, res) => {
  const { names } = req.body;
  if (!Array.isArray(names)) {
    return res.status(400).json({ error: "Missing 'names' array." });
  }

  const results = await Promise.all(names.map(checkTrademark));
  res.json({ available: results.filter(r => r.isAvailable) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Trademark Checker API running on port ${PORT}`));
