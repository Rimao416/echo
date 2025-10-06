"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Loader2, Volume2, Settings, Sparkles, Upload, Trash2 } from 'lucide-react';

export default function EchoTTS() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [speed, setSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [recordingMode, setRecordingMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const voices = [
    { id: 'default', name: 'Voix par défaut', type: 'Féminine' },
    { id: 'custom-1', name: 'Ma voix', type: 'Personnalisée' },
    { id: 'male-1', name: 'Voix masculine', type: 'Masculine' },
  ];

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    // Simulation - À remplacer par l'appel API backend
    setTimeout(() => {
      // Mock audio URL
      setAudioUrl('mock-audio-url');
      setIsGenerating(false);
    }, 2000);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    // Logic pour télécharger l'audio
    console.log('Téléchargement...');
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Echo</h1>
              <p className="text-xs text-slate-400">Synthèse vocale locale</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Texte à synthétiser
                </h2>
                <span className="text-xs text-slate-400">{text.length} caractères</span>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez votre texte en français ici... Echo va le transformer en parole naturelle."
                className="w-full h-64 p-6 bg-transparent resize-none focus:outline-none text-slate-200 placeholder:text-slate-600"
              />
              
              <div className="p-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!text.trim() || isGenerating}
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
                        Générer
                      </>
                    )}
                  </button>

                  {audioUrl && (
                    <>
                      <button
                        onClick={togglePlayPause}
                        className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={handleDownload}
                        className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  {isGenerating && (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                      Traitement en cours...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Waveform Visualization */}
            {audioUrl && (
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
                
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voice Selection */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4 text-violet-400" />
                Sélection de voix
              </h3>
              
              <div className="space-y-2">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-2 border-violet-500/50'
                        : 'bg-slate-800/30 border-2 border-transparent hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{voice.type}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setRecordingMode(true)}
                className="w-full mt-4 p-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/50 transition-all flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-violet-400"
              >
                <Upload className="w-4 h-4" />
                Créer une nouvelle voix
              </button>
            </div>

            {/* Settings */}
            {showSettings && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
                <h3 className="font-semibold mb-4">Paramètres</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">
                      Vitesse: {speed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800/50">
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Modèle:</span>
                        <span className="text-slate-400">Coqui XTTS v2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GPU:</span>
                        <span className="text-green-400">Actif</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-400">Statistiques</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Audios générés</span>
                    <span className="font-semibold">127</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-violet-600 to-purple-600" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Temps total</span>
                    <span className="font-semibold">2h 34m</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-violet-600 to-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}