const express = require('express');
const crypto = require('crypto');
const { readFile, writeFile, unlink } = require('fs/promises');
const { PDFDocument } = require('pdf-lib');
const pdf = require('pdf-parse');
const { Book, Reading, PageCache } = require('../models');

const router = express.Router();

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

router.post('/', async (req, res) => {
  let tempFilePath = null;
  let tempPartialPath = null;

  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfFile = req.files.pdf;
    const startPage = parseInt(req.body.startPage) || 1;
    const pageCount = parseInt(req.body.pageCount) || 5;

    // Fichier temporaire initial
    tempFilePath = pdfFile.tempFilePath;

    // Lire le buffer du PDF
    const fileBuffer = await readFile(tempFilePath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    // Vérifier si le livre existe déjà
    let book = await Book.findOne({ fileHash });
    let totalPages;

    // On récupère le totalPages une seule fois (si pas déjà connu)
    if (!book) {
      const fullDoc = await PDFDocument.load(fileBuffer);
      totalPages = fullDoc.getPageCount();

      book = await Book.create({
        title: pdfFile.name.replace('.pdf', ''),
        filename: pdfFile.name,
        totalPages,
        fileHash,
      });
    } else {
      totalPages = book.totalPages;
    }

    // Gérer la plage de pages
    const endPage = Math.min(startPage + pageCount - 1, totalPages);

    // Vérifier si déjà en cache
    let cachedPage = await PageCache.findOne({
      bookId: book._id,
      pageStart: startPage,
      pageEnd: endPage,
    });

    let extractedText = '';

    if (cachedPage) {
      extractedText = cachedPage.extractedText;
    } else {
      // Extraire uniquement les pages demandées avec pdf-lib
      const fullPdf = await PDFDocument.load(fileBuffer);
      const newPdf = await PDFDocument.create();

      for (let i = startPage - 1; i < endPage; i++) {
        const [page] = await newPdf.copyPages(fullPdf, [i]);
        newPdf.addPage(page);
      }

      const partialPdfBytes = await newPdf.save();
      tempPartialPath = `${tempFilePath}_part.pdf`;
      await writeFile(tempPartialPath, partialPdfBytes);

      // Lire uniquement les pages extraites
      const extracted = await pdf(partialPdfBytes);
      extractedText = cleanExtractedText(extracted.text);
      extractedText = `--- Pages ${startPage}-${endPage} ---\n\n${extractedText}`;

      // Sauvegarde dans le cache
      await PageCache.create({
        bookId: book._id,
        pageStart: startPage,
        pageEnd: endPage,
        extractedText,
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
        currentPage: 1,
      });
    }

    // Nettoyer les fichiers temporaires
    await Promise.all([
      tempFilePath && unlink(tempFilePath).catch(() => {}),
      tempPartialPath && unlink(tempPartialPath).catch(() => {}),
    ]);

    res.json({
      text: extractedText,
      bookId: book._id,
      readingId: reading._id,
      currentPage: startPage,
      endPage,
      totalPages,
      hasMore: endPage < totalPages,
      progress: Math.round((endPage / totalPages) * 100),
    });
  } catch (error) {
    // Nettoyage en cas d'erreur
    await Promise.all([
      tempFilePath && unlink(tempFilePath).catch(() => {}),
      tempPartialPath && unlink(tempPartialPath).catch(() => {}),
    ]);

    console.error('Error extracting PDF:', error);
    res.status(500).json({
      error: 'Failed to extract PDF text',
      details: error.message,
    });
  }
});

module.exports = router;
