// components/VoiceSelector.tsx
import React from 'react';
import { Mic } from 'lucide-react';
import { Voice } from '../types';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onVoiceChange,
}) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
    <h3 className="font-semibold mb-4 flex items-center gap-2">
      <Mic className="w-4 h-4 text-violet-400" />
      Sélection de voix
    </h3>
    
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {voices.map((voice) => (
        <button
          key={voice.id}
          onClick={() => onVoiceChange(voice.id)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            selectedVoiceId === voice.id
              ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-2 border-violet-500/50'
              : 'bg-slate-800/30 border-2 border-transparent hover:bg-slate-800/50'
          }`}
        >
          <div className="font-medium">{voice.name}</div>
          <div className="text-xs text-slate-400 mt-1">{voice.type}</div>
        </button>
      ))}
    </div>
  </div>
);