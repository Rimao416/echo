const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(
      'https://api.elevenlabs.io/v1/user/subscription',
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 0,
      remainingCharacters: (data.character_limit || 0) - (data.character_count || 0),
      canExtend: data.can_extend || false,
      tier: data.tier || 'free',
    });
  } catch (error) {
    console.error('Error fetching quota:', error);
    res.status(500).json({
      error: 'Failed to fetch quota',
      details: error.message,
    });
  }
});

module.exports = router;