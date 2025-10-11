const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    totalCharacters: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const readingSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    currentOffset: {
      type: Number,
      default: 0,
    },
    lastReadOffset: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Nouveau schéma pour stocker le texte complet
const textCacheSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      unique: true,
      index: true,
    },
    fullText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);
const Reading = mongoose.model('Reading', readingSchema);
const TextCache = mongoose.model('TextCache', textCacheSchema);

module.exports = { Book, Reading, TextCache };