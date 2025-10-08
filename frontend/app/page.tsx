"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Loader2, Volume2, Settings, Sparkles, Upload, Trash2 } from 'lucide-react';

export default function EchoTTS() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel - voix féminine naturelle
  const [speed, setSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Meilleures voix ElevenLabs avec émotions
  const voices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', type: 'Féminine - Naturelle' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', type: 'Féminine - Confiante' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', type: 'Féminine - Douce' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', type: 'Masculine - Chaleureuse' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', type: 'Masculine - Crispy' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', type: 'Masculine - Profonde' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', type: 'Masculine - Dynamique' },
  ];

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Veuillez entrer du texte');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceId: selectedVoice,
          modelId: 'eleven_multilingual_v2', // Meilleur modèle pour les émotions
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Libérer l'ancienne URL si elle existe
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      
      // Jouer automatiquement
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de générer l\'audio. Vérifiez votre clé API.');
    } finally {
      setIsGenerating(false);
    }
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
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `echo-tts-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
              <p className="text-xs text-slate-400">Powered by ElevenLabs</p>
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
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
                {error}
              </div>
            )}

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
                placeholder="Entrez votre texte ici... Echo va le transformer en parole naturelle avec émotions."
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
                
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
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
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                        <span className="text-slate-400">Eleven Multilingual v2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span className="text-violet-400">ElevenLabs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qualité:</span>
                        <span className="text-green-400">Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-400">À propos</h3>
              
              <div className="text-xs text-slate-500 space-y-2">
                <p>Echo utilise le modèle <span className="text-violet-400">Eleven Multilingual v2</span> d'ElevenLabs pour une synthèse vocale ultra-réaliste avec émotions naturelles.</p>
                <p className="pt-2 border-t border-slate-800/50 text-slate-600">
                  Les voix sont générées en temps réel avec une qualité studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}