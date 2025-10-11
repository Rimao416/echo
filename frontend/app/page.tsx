"use client"
import React, { useState, useRef, useEffect } from 'react';
import { BookData, Voice, QuotaInfo, ErrorInfo } from '../types';
import { Header } from '@/components/Header';
import { ErrorAlert } from '@/components/ErrorAlert';
import { ModeSelector } from '@/components/ModeSelector';
import { PdfInfo } from '@/components/PdfInfo';
import { TextEditor } from '@/components/TextEditor';
import { VoiceSelector } from '@/components/VoiceSelector';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Guide } from '@/components/Guide';
import { Statistics } from '@/components/Statistics';
import { AudioVisualizer } from '@/components/AudioVisualizer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const voices: Voice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', type: 'Féminine - Naturelle' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', type: 'Féminine - Confiante' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', type: 'Féminine - Douce' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', type: 'Masculine - Chaleureuse' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', type: 'Masculine - Crispy' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', type: 'Masculine - Profonde' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', type: 'Masculine - Dynamique' },
];

interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: string;
  remainingCredits?: number;
  requiredCredits?: number;
}

interface ExtendedBookData {
  bookId: string;
  readingId: string;
  currentOffset: number;
  nextOffset: number;
  totalCharacters: number;
  charactersRead: number;
  hasMore: boolean;
  progress: number;
  chunkSize: number;
}

export default function EchoTTS() {
  const [text, setText] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bookData, setBookData] = useState<ExtendedBookData | null>(null);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [speed, setSpeed] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuota = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-quota`);
      if (response.ok) {
        const data = await response.json();
        setQuotaInfo(data);
      }
    } catch (err) {
      console.error('Erreur récupération quota:', err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const showError = (type: 'error' | 'warning' | 'info', message: string, details?: ApiErrorResponse | string) => {
    setErrorInfo({
      type,
      message,
      details: typeof details === 'object' ? details.details : details,
      remainingCredits: typeof details === 'object' ? details.remainingCredits : undefined,
      requiredCredits: typeof details === 'object' ? details.requiredCredits : undefined,
    });
  };

  const extractPdfChunk = async (offset: number) => {
    if (!pdfFile) return;
    
    setIsExtracting(true);
    setErrorInfo(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('offset', offset.toString());

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'extraction');
      }

      const data = await response.json();
      
      setBookData({
        bookId: data.bookId,
        readingId: data.readingId,
        currentOffset: data.currentOffset,
        nextOffset: data.nextOffset,
        totalCharacters: data.totalCharacters,
        charactersRead: data.charactersRead,
        hasMore: data.hasMore,
        progress: data.progress,
        chunkSize: data.chunkSize,
      });
      
      setText(data.text);
      setCurrentOffset(data.nextOffset);
      
    } catch (err) {
      const error = err as Error;
      showError('error', 'Impossible d\'extraire le texte du PDF', error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      showError('error', 'Veuillez sélectionner un fichier PDF valide');
      return;
    }

    setPdfFile(file);
    setCurrentOffset(0);
    setMode('pdf');
    await extractPdfChunk(0);
  };

  const loadNextChunk = async () => {
    if (!bookData) return;
    await extractPdfChunk(bookData.nextOffset);
  };

  const loadPreviousChunk = async () => {
    if (!bookData || currentOffset === 0) return;
    
    // Pour revenir en arrière, il faudrait stocker l'historique des offsets
    // Pour simplifier, on repart du début
    showError('info', 'Pour revenir en arrière, rechargez le PDF depuis le début');
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      showError('warning', 'Veuillez entrer du texte ou uploader un PDF');
      return;
    }
    
    setIsGenerating(true);
    setErrorInfo(null);
    
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
        const errorData: ApiErrorResponse = await response.json();
        if (errorData.error === 'quota_exceeded') {
          showError('error', errorData.message || 'Quota dépassé', errorData);
          await fetchQuota();
          return;
        }
        throw new Error(errorData.message || 'Erreur lors de la génération');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      
      setAudioUrl(url);
      await fetchQuota();
      
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
      
    } catch (err) {
      const error = err as Error;
      showError('error', 'Impossible de générer l\'audio', error.message);
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
    setCurrentOffset(0);
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
      setTimeout(() => loadNextChunk(), 1000);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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

      <Header 
        quotaInfo={quotaInfo} 
        onSettingsClick={() => setShowSettings(!showSettings)} 
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ErrorAlert 
              error={errorInfo} 
              onClose={() => setErrorInfo(null)} 
            />

            <ModeSelector
              mode={mode}
              onModeChange={setMode}
              onUploadClick={() => fileInputRef.current?.click()}
            />

            {pdfFile && bookData && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="font-medium">{pdfFile.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {bookData.charactersRead.toLocaleString()} / {bookData.totalCharacters.toLocaleString()} caractères
                    </div>
                  </div>
                  <button
                    onClick={clearPdf}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Fermer
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={loadNextChunk}
                    disabled={!bookData.hasMore || isExtracting}
                    className="flex-1 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExtracting ? 'Chargement...' : bookData.hasMore ? 'Charger la suite' : 'Terminé'}
                  </button>
                </div>
              </div>
            )}

            <TextEditor
              text={text}
              mode={mode}
              isExtracting={isExtracting}
              isGenerating={isGenerating}
              isPlaying={isPlaying}
              hasAudio={!!audioUrl}
              currentPage={undefined}
              endPage={undefined}
              onTextChange={setText}
              onGenerate={handleGenerate}
              onTogglePlayPause={togglePlayPause}
              onDownload={handleDownload}
            />

            {audioUrl && (
              <AudioVisualizer
                isPlaying={isPlaying}
                audioRef={audioRef}
                audioUrl={audioUrl}
                onEnded={handleAudioEnded}
              />
            )}
          </div>

          <div className="space-y-6">
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoice}
              onVoiceChange={setSelectedVoice}
            />

            {showSettings && (
              <SettingsPanel
                speed={speed}
                onSpeedChange={setSpeed}
                apiBaseUrl={API_BASE_URL}
                pagesPerBatch={0}
              />
            )}

 <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-6">
  <h3 className="font-semibold mb-4 text-sm text-slate-400">Guide</h3>
  <div className="text-xs text-slate-500 space-y-3">
    <p>
      ✨ Extraction par <strong>500 caractères minimum</strong> jusqu'au prochain point
    </p>
    <p>
      📖 Cliquez sur "Charger la suite" pour continuer la lecture
    </p>
    <p>
      🎧 L'audio se génère automatiquement après chaque chunk
    </p>
  </div>
</div>



            {bookData && (
              <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/30 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 text-sm">Statistiques</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Caractères lus</span>
                    <span className="font-bold text-violet-400">
                      {bookData.charactersRead.toLocaleString()} / {bookData.totalCharacters.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Progression</span>
                    <span className="font-bold text-purple-400">{bookData.progress}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Dernier chunk</span>
                    <span className="font-bold text-slate-300">{bookData.chunkSize} caractères</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}