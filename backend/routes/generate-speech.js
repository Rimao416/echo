const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, voiceId, modelId } = req.body;

    if (!text || !voiceId) {
      return res.status(400).json({ error: 'Text and voiceId are required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      // Gestion spécifique de l'erreur de quota
      if (errorData.detail?.status === 'quota_exceeded') {
        return res.status(402).json({
          error: 'quota_exceeded',
          message: 'Quota de caractères ElevenLabs dépassé',
          details: errorData.detail.message,
          remainingCredits: extractCreditsFromMessage(errorData.detail.message, 'remaining'),
          requiredCredits: extractCreditsFromMessage(errorData.detail.message, 'required'),
        });
      }
      
      // Autres erreurs API
      return res.status(response.status).json({
        error: 'api_error',
        message: errorData.detail?.message || 'Erreur API ElevenLabs',
        details: errorData,
      });
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Erreur lors de la génération audio',
      details: error.message,
    });
  }
});

// Fonction helper pour extraire les crédits du message d'erreur
function extractCreditsFromMessage(message, type) {
  if (type === 'remaining') {
    const match = message.match(/You have (\d+) credits remaining/);
    return match ? parseInt(match[1]) : null;
  } else if (type === 'required') {
    const match = message.match(/(\d+) credits are required/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

module.exports = router;