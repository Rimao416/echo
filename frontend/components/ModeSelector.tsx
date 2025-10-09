// components/ModeSelector.tsx
import React from 'react';
import { Sparkles, FileText } from 'lucide-react';

interface ModeSelectorProps {
  mode: 'text' | 'pdf';
  onModeChange: (mode: 'text' | 'pdf') => void;
  onUploadClick: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
  onUploadClick,
}) => (
  <div className="flex gap-4">
    <button
      onClick={() => onModeChange('text')}
      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
        mode === 'text'
          ? 'bg-violet-600/20 border-violet-500'
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
      }`}
    >
      <Sparkles className="w-5 h-5 mx-auto mb-2" />
      <div className="text-sm font-medium">Texte libre</div>
    </button>
    
    <button
      onClick={onUploadClick}
      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
        mode === 'pdf'
          ? 'bg-violet-600/20 border-violet-500'
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
      }`}
    >
      <FileText className="w-5 h-5 mx-auto mb-2" />
      <div className="text-sm font-medium">Importer PDF</div>
    </button>
  </div>
);
