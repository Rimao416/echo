const express = require('express');
const crypto = require('crypto');
const { readFile, writeFile, unlink } = require('fs/promises');
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
const { Book, Reading, TextCache } = require('../models');

const router = express.Router();

const MIN_CHARS = 500; // Minimum de caractères à extraire

/**
 * Nettoyage léger du texte extrait
 */
function cleanExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extrait MIN_CHARS caractères + jusqu'au prochain point
 */
function extractChunk(fullText, startOffset) {
  if (!fullText || startOffset >= fullText.length) {
    return { text: '', endOffset: fullText?.length || 0, hasMore: false };
  }

  let endOffset = startOffset + MIN_CHARS;
  
  // Si on dépasse la fin du texte
  if (endOffset >= fullText.length) {
    return {
      text: fullText.substring(startOffset).trim(),
      endOffset: fullText.length,
      hasMore: false
    };
  }

  // Chercher le prochain point après MIN_CHARS
  const searchText = fullText.substring(endOffset);
  const sentenceEnd = searchText.search(/[.!?]["""')]*(\s|$)/);

  if (sentenceEnd !== -1) {
    // Inclure le point et les espaces/guillemets qui suivent
    endOffset += sentenceEnd + 1;
    // Avancer jusqu'au prochain caractère non-espace
    while (endOffset < fullText.length && /\s/.test(fullText[endOffset])) {
      endOffset++;
    }
  } else {
    // Pas de point trouvé, prendre jusqu'à la fin
    endOffset = fullText.length;
  }

  return {
    text: fullText.substring(startOffset, endOffset).trim(),
    endOffset: endOffset,
    hasMore: endOffset < fullText.length
  };
}

router.post('/', async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfFile = req.files.pdf;
    const requestedOffset = parseInt(req.body.offset) || 0;

    tempFilePath = pdfFile.tempFilePath;
    const fileBuffer = await readFile(tempFilePath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Vérifier si le livre existe
    let book = await Book.findOne({ fileHash });
    let fullText;

    if (!book) {
      // Nouveau livre : extraire tout le texte
      const fullDoc = await PDFDocument.load(fileBuffer);
      const totalPages = fullDoc.getPageCount();
      
      // Extraire tout le PDF
      const extracted = await pdf(fileBuffer);
      fullText = cleanExtractedText(extracted.text);
      
      const totalChars = fullText.length;

      book = await Book.create({
        title: pdfFile.name.replace('.pdf', ''),
        filename: pdfFile.name,
        totalPages,
        totalCharacters: totalChars,
        fileHash,
      });

      // Stocker le texte complet dans le cache
      await TextCache.create({
        bookId: book._id,
        fullText: fullText,
      });
    } else {
      // Livre existant : récupérer le texte du cache
      const cached = await TextCache.findOne({ bookId: book._id });
      if (!cached) {
        return res.status(500).json({ error: 'Text cache not found' });
      }
      fullText = cached.fullText;
    }

    // Extraire le chunk demandé
    const { text, endOffset, hasMore } = extractChunk(fullText, requestedOffset);

    if (!text) {
      return res.status(400).json({ 
        error: 'No more text to extract',
        message: 'Vous avez atteint la fin du document'
      });
    }

    // Gérer la session de lecture
    let reading = await Reading.findOne({
      bookId: book._id,
      isCompleted: false,
    }).sort({ lastReadAt: -1 });

    if (!reading) {
      reading = await Reading.create({
        bookId: book._id,
        currentOffset: 0,
      });
    }

    // Mettre à jour la progression
    await Reading.findByIdAndUpdate(reading._id, {
      currentOffset: requestedOffset,
      lastReadOffset: endOffset,
      lastReadAt: new Date(),
      isCompleted: !hasMore,
    });

    // Nettoyer le fichier temporaire
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    const progress = Math.round((endOffset / book.totalCharacters) * 100);

    res.json({
      text: text,
      bookId: book._id,
      readingId: reading._id,
      currentOffset: requestedOffset,
      nextOffset: endOffset,
      totalCharacters: book.totalCharacters,
      charactersRead: endOffset,
      hasMore: hasMore,
      progress: progress,
      chunkSize: text.length,
    });
  } catch (error) {
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    console.error('Error extracting PDF:', error);
    res.status(500).json({
      error: 'Failed to extract PDF text',
      details: error.message,
    });
  }
});

module.exports = router;