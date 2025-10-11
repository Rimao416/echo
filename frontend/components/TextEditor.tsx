// components/TextEditor.tsx
import React from 'react';
import { Sparkles, Loader2, Play, Pause, Download } from 'lucide-react';

interface TextEditorProps {
  text: string;
  mode: 'text' | 'pdf';
  isExtracting: boolean;
  isGenerating: boolean;
  isPlaying: boolean;
  hasAudio: boolean;
  currentPage?: number;
  endPage?: number;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  onTogglePlayPause: () => void;
  onDownload: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  mode,
  isExtracting,
  isGenerating,
  isPlaying,
  hasAudio,
  currentPage,
  endPage,
  onTextChange,
  onGenerate,
  onTogglePlayPause,
  onDownload,
}) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
    <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
      <h2 className="font-semibold flex items-center gap-2">
        {isExtracting ? (
          <>
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            Extraction en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-violet-400" />
            {mode === 'pdf' && currentPage ? `Pages ${currentPage}-${endPage}` : 'Texte à synthétiser'}
          </>
        )}
      </h2>
      <span className="text-xs text-slate-400">
        {text.length.toLocaleString()} caractères
      </span>
    </div>
    
    <textarea
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      placeholder="Entrez votre texte ici ou importez un PDF pour le lire..."
      className="w-full h-64 p-6 bg-transparent resize-none focus:outline-none text-slate-200 placeholder:text-slate-600"
      disabled={isExtracting || isGenerating}
    />
    
    <div className="p-4 border-t border-slate-800/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={!text.trim() || isGenerating || isExtracting}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Lire ces pages
            </>
          )}
        </button>

        {hasAudio && (
          <>
            <button
              onClick={onTogglePlayPause}
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onDownload}
              className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);