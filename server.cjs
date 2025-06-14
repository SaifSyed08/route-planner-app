const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY;

app.get('/api/wifi', async (req, res) => {
  const { lat, lng, type = 'cafe' } = req.query;

  if (!GOOGLE_PLACES_KEY) {
    return res.status(500).json({ error: 'Missing Google API key' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${GOOGLE_PLACES_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Google Places' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
