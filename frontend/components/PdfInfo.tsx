// components/PdfInfo.tsx
import React from 'react';
import { BookMarked, Trash2, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { BookData } from '../types';

interface PdfInfoProps {
  pdfFile: File;
  bookData: BookData;
  isExtracting: boolean;
  currentPageStart: number;
  onClear: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const PdfInfo: React.FC<PdfInfoProps> = ({
  pdfFile,
  bookData,
  isExtracting,
  currentPageStart,
  onClear,
  onPrevious,
  onNext,
}) => (
  <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/30 rounded-xl p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
          <BookMarked className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <div className="font-medium">{pdfFile.name}</div>
          <div className="text-xs text-slate-400">
            Pages {bookData.currentPage}-{bookData.endPage} sur {bookData.totalPages}
          </div>
        </div>
      </div>
      <button
        onClick={onClear}
        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Progression: {bookData.progress}%
        </span>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={currentPageStart <= 1 || isExtracting}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          >
            <SkipBack className="w-4 h-4" />
            Précédent
          </button>
          <button
            onClick={onNext}
            disabled={!bookData.hasMore || isExtracting}
            className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          >
            Suivant
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
          style={{ width: `${bookData.progress}%` }}
        />
      </div>
    </div>
  </div>
);
