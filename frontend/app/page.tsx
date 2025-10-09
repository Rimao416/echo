"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Loader2, Volume2, Settings, Sparkles, Trash2, FileText, SkipForward, SkipBack, BookMarked } from 'lucide-react';

// Configuration de l'API Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface BookData {
  bookId: string;
  readingId: string;
  totalPages: number;
  currentPage: number;
  endPage: number;
  hasMore: boolean;
  progress: number;
}

interface Voice {
  id: string;
  name: string;
  type: string;
}

export default function EchoTTS() {
  const [text, setText] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [currentPageStart, setCurrentPageStart] = useState<number>(1);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [speed, setSpeed] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [pagesPerBatch] = useState<number>(5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const voices: Voice[] = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', type: 'Féminine - Naturelle' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', type: 'Féminine - Confiante' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', type: 'Féminine - Douce' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', type: 'Masculine - Chaleureuse' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', type: 'Masculine - Crispy' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', type: 'Masculine - Profonde' },
    { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', type: 'Masculine - Dynamique' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier PDF valide');
      return;
    }

    setPdfFile(file);
    setIsExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('startPage', '1');
      formData.append('pageCount', pagesPerBatch.toString());

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'extraction du PDF');
      }

      const data = await response.json();
      
      setBookData({
        bookId: data.bookId,
        readingId: data.readingId,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        endPage: data.endPage,
        hasMore: data.hasMore,
        progress: data.progress
      });
      
      setText(data.text);
      setCurrentPageStart(data.currentPage);
      setMode('pdf');
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible d\'extraire le texte du PDF');
    } finally {
      setIsExtracting(false);
    }
  };

  const loadNextBatch = async () => {
    if (!pdfFile || !bookData) return;

    setIsExtracting(true);
    setError(null);

    try {
      const nextPageStart = bookData.endPage + 1;
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('startPage', nextPageStart.toString());
      formData.append('pageCount', pagesPerBatch.toString());

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'extraction');
      }

      const data = await response.json();
      
      setBookData(prev => prev ? ({
        ...prev,
        currentPage: data.currentPage,
        endPage: data.endPage,
        hasMore: data.hasMore,
        progress: data.progress
      }) : null);
      
      setText(data.text);
      setCurrentPageStart(data.currentPage);
      
      await updateProgress(data.currentPage, data.endPage);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les pages suivantes');
    } finally {
      setIsExtracting(false);
    }
  };

  const loadPreviousBatch = async () => {
    if (!pdfFile || !bookData || currentPageStart <= 1) return;

    setIsExtracting(true);
    setError(null);

    try {
      const prevPageStart = Math.max(1, currentPageStart - pagesPerBatch);
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('startPage', prevPageStart.toString());
      formData.append('pageCount', pagesPerBatch.toString());

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'extraction');
      }

      const data = await response.json();
      
      setBookData(prev => prev ? ({
        ...prev,
        currentPage: data.currentPage,
        endPage: data.endPage,
        hasMore: data.hasMore,
        progress: data.progress
      }) : null);
      
      setText(data.text);
      setCurrentPageStart(data.currentPage);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les pages précédentes');
    } finally {
      setIsExtracting(false);
    }
  };

  const updateProgress = async (currentPage: number, lastReadPage: number) => {
    if (!bookData) return;

    try {
      await fetch(`${API_BASE_URL}/update-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId: bookData.readingId,
          currentPage,
          lastReadPage
        })
      });
    } catch (err) {
      console.error('Erreur mise à jour progression:', err);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Veuillez entrer du texte ou uploader un PDF');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/generate-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voiceId: selectedVoice,
          modelId: 'eleven_multilingual_v2',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      
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

  const clearPdf = () => {
    setPdfFile(null);
    setBookData(null);
    setCurrentPageStart(1);
    setMode('text');
    setText('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (mode === 'pdf' && bookData?.hasMore) {
      setTimeout(() => loadNextBatch(), 1000);
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

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
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setMode('text')}
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
                onClick={() => fileInputRef.current?.click()}
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

            {pdfFile && bookData && (
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
                    onClick={clearPdf}
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
                        onClick={loadPreviousBatch}
                        disabled={currentPageStart <= 1 || isExtracting}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                      >
                        <SkipBack className="w-4 h-4" />
                        {pagesPerBatch} pages précédentes
                      </button>
                      <button
                        onClick={loadNextBatch}
                        disabled={!bookData.hasMore || isExtracting}
                        className="px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                      >
                        {pagesPerBatch} pages suivantes
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
            )}

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
                      {mode === 'pdf' && bookData ? `Pages ${bookData.currentPage}-${bookData.endPage}` : 'Texte à synthétiser'}
                    </>
                  )}
                </h2>
                <span className="text-xs text-slate-400">
                  {text.length.toLocaleString()} caractères
                </span>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => mode === 'text' && setText(e.target.value)}
                placeholder="Entrez votre texte ici ou importez un PDF pour le lire..."
                className="w-full h-64 p-6 bg-transparent resize-none focus:outline-none text-slate-200 placeholder:text-slate-600"
                readOnly={mode === 'pdf'}
              />
              
              <div className="p-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
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
              </div>
            </div>

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
                  onEnded={handleAudioEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
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
                        <span>Backend:</span>
                        <span className="text-green-400">Express + MongoDB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API:</span>
                        <span className="text-slate-400">{API_BASE_URL}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages par lot:</span>
                        <span className="text-green-400">{pagesPerBatch}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {bookData && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}