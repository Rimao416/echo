const express = require('express');
const { Reading, Book } = require('../models');

const router = express.Router();

// POST - Mettre à jour la progression
router.post('/', async (req, res) => {
  try {
    const { readingId, currentPage, lastReadPage } = req.body;

    if (!readingId) {
      return res.status(400).json({ error: 'Reading ID required' });
    }

    const reading = await Reading.findByIdAndUpdate(
      readingId,
      {
        currentPage,
        lastReadPage,
        totalPagesRead: lastReadPage,
        lastReadAt: new Date(),
      },
      { new: true }
    ).populate('bookId');

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    // Vérifier si terminé
    if (lastReadPage >= reading.bookId.totalPages) {
      await Reading.findByIdAndUpdate(readingId, { isCompleted: true });
    }

    res.json({ success: true, reading });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      error: 'Failed to update progress',
      details: error.message,
    });
  }
});

// GET - Récupérer la progression
router.get('/', async (req, res) => {
  try {
    const { bookId } = req.query;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID required' });
    }

    const reading = await Reading.findOne({
      bookId,
      isCompleted: false,
    })
      .sort({ lastReadAt: -1 })
      .populate('bookId');

    res.json({ reading });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      details: error.message,
    });
  }
});

module.exports = router;
