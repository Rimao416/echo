// components/AudioVisualizer.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string;
  onEnded: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  audioRef,
  audioUrl,
  onEnded,
}) => (
  <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
    <div className="flex items-center gap-4 mb-4">
      <Volume2 className="w-5 h-5 text-violet-400" />
      <div className="flex-1">
        <div className="h-24 flex items-center gap-1">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-violet-600 to-purple-500 rounded-full transition-all"
              style={{
                height: `${Math.random() * 100}%`,
                opacity: isPlaying ? 1 : 0.3
              }}
            />
          ))}
        </div>
      </div>
    </div>
    
    <audio 
      ref={audioRef} 
      src={audioUrl} 
      onEnded={onEnded}
    />
  </div>
);
