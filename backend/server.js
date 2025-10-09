const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const extractPdfRoute = require('./routes/extract-pdf');
const generateSpeechRoute = require('./routes/generate-speech');
const updateProgressRoute = require('./routes/update-progress');
const userQuotaRoute = require('./routes/user-quota');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echo-tts', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connecté'))
  .catch((err) => {
    console.error('❌ Erreur MongoDB:', err);
    process.exit(1);
  });

// Routes
app.use('/api/extract-pdf', extractPdfRoute);
app.use("/api/user-quota", userQuotaRoute);
app.use('/api/generate-speech', generateSpeechRoute);
app.use('/api/update-progress', updateProgressRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
