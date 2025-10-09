// components/Statistics.tsx
import React from 'react';
import { BookData } from '../types';

interface StatisticsProps {
  bookData: BookData;
  pagesPerBatch: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ bookData, pagesPerBatch }) => (
  <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/30 rounded-2xl p-6">
    <h3 className="font-semibold mb-4 text-sm">Statistiques</h3>
    
    <div className="space-y-3 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Pages lues</span>
        <span className="font-bold text-violet-400">{bookData.endPage} / {bookData.totalPages}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Progression</span>
        <span className="font-bold text-purple-400">{bookData.progress}%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-slate-400">Lot actuel</span>
        <span className="font-bold text-slate-300">
          {Math.ceil(bookData.endPage / pagesPerBatch)} / {Math.ceil(bookData.totalPages / pagesPerBatch)}
        </span>
      </div>
      {bookData.hasMore && (
        <div className="pt-3 border-t border-violet-500/20">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {bookData.totalPages - bookData.endPage} pages restantes
          </div>
        </div>
      )}
    </div>
  </div>
);