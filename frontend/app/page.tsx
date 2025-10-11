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
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [pagesPerBatch] = useState<number>(5);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      showError('error', 'Veuillez sélectionner un fichier PDF valide');
      return;
    }

    setPdfFile(file);
    setIsExtracting(true);
    setErrorInfo(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('startPage', '1');
      formData.append('pageCount', pagesPerBatch.toString());

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur lors de l\'extraction du PDF');

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
      const error = err as Error;
      showError('error', 'Impossible d\'extraire le texte du PDF', error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const loadNextBatch = async () => {
    if (!pdfFile || !bookData) return;
    setIsExtracting(true);
    setErrorInfo(null);

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

      if (!response.ok) throw new Error('Erreur lors de l\'extraction');

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
      const error = err as Error;
      showError('error', 'Impossible de charger les pages suivantes', error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const loadPreviousBatch = async () => {
    if (!pdfFile || !bookData || currentPageStart <= 1) return;
    setIsExtracting(true);
    setErrorInfo(null);

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

      if (!response.ok) throw new Error('Erreur lors de l\'extraction');

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
      const error = err as Error;
      showError('error', 'Impossible de charger les pages précédentes', error.message);
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
              <PdfInfo
                pdfFile={pdfFile}
                bookData={bookData}
                isExtracting={isExtracting}
                currentPageStart={currentPageStart}
                onClear={clearPdf}
                onPrevious={loadPreviousBatch}
                onNext={loadNextBatch}
              />
            )}

            <TextEditor
              text={text}
              mode={mode}
              isExtracting={isExtracting}
              isGenerating={isGenerating}
              isPlaying={isPlaying}
              hasAudio={!!audioUrl}
              currentPage={bookData?.currentPage}
              endPage={bookData?.endPage}
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
                pagesPerBatch={pagesPerBatch}
              />
            )}

            <Guide pagesPerBatch={pagesPerBatch} />

            {bookData && (
              <Statistics 
                bookData={bookData} 
                pagesPerBatch={pagesPerBatch} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}