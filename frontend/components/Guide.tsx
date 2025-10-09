// components/Guide.tsx
import React from 'react';

interface GuideProps {
  pagesPerBatch: number;
}

export const Guide: React.FC<GuideProps> = ({ pagesPerBatch }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
    <h3 className="font-semibold mb-4 text-sm text-slate-400">Guide</h3>
    
    <div className="text-xs text-slate-500 space-y-3">
      <div className="flex gap-2">
        <div className="w-5 h-5 rounded bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-violet-400">1</span>
        </div>
        <p>Importez un PDF - seules les premières {pagesPerBatch} pages seront extraites</p>
      </div>
      <div className="flex gap-2">
        <div className="w-5 h-5 rounded bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-violet-400">2</span>
        </div>
        <p>Choisissez une voix et générez l&apos;audio</p>
      </div>
      <div className="flex gap-2">
        <div className="w-5 h-5 rounded bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-violet-400">3</span>
        </div>
        <p>Naviguez entre les lots avec les boutons de pagination</p>
      </div>
    </div>
  </div>
);
