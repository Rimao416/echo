// components/Header.tsx
import React from 'react';
import { Volume2, Settings, Sparkles } from 'lucide-react';
import { QuotaInfo } from '../types';

interface HeaderProps {
  quotaInfo: QuotaInfo | null;
  onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ quotaInfo, onSettingsClick }) => (
  <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Volume2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Echo</h1>
          <p className="text-xs text-slate-400">PDF Reader + ElevenLabs</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {quotaInfo && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <div className="text-xs">
              <div className="text-slate-400">Crédits restants</div>
              <div className="font-bold text-violet-400">
                {quotaInfo.remainingCharacters.toLocaleString()} / {quotaInfo.characterLimit.toLocaleString()}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);
