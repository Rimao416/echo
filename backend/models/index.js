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
    currentPage: {
      type: Number,
      default: 1,
    },
    lastReadPage: {
      type: Number,
      default: 0,
    },
    totalPagesRead: {
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

const pageCacheSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    pageStart: {
      type: Number,
      required: true,
    },
    pageEnd: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour la recherche unique des pages en cache
pageCacheSchema.index({ bookId: 1, pageStart: 1, pageEnd: 1 }, { unique: true });

const Book = mongoose.model('Book', bookSchema);
const Reading = mongoose.model('Reading', readingSchema);
const PageCache = mongoose.model('PageCache', pageCacheSchema);

module.exports = { Book, Reading, PageCache };
