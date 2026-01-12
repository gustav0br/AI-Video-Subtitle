import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileVideo, X, CheckCircle, AlertCircle, RefreshCw, Search, Languages } from 'lucide-react';
import { Button } from './Button';
import { ProcessStatus, SubtitleResult } from '../types';
import { searchExistingSubtitles, searchSubtitlesByName } from '../services/subtitleSearchService';
import { translateSrtContent } from '../services/translationService';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadFormProps {
  onSuccess: (result: SubtitleResult) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showTranslateOption, setShowTranslateOption] = useState(false);
  const [lastSearchType, setLastSearchType] = useState<'name' | 'hash' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const startSimulatedProgress = useCallback(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 800);
    return interval;
  }, []);

  const isValidVideoFile = (file: File) => {
    const videoTypes = ['video/', 'application/x-matroska', 'application/octet-stream'];
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ts'];
    
    // Check MIME type
    if (file.type.startsWith('video/')) return true;
    
    // Check extension if MIME type is generic or missing
    const fileName = file.name.toLowerCase();
    return videoExtensions.some(ext => fileName.endsWith(ext));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isValidVideoFile(file)) {
        setError(t('upload.errorFile'));
        return;
      }
      setVideoFile(file);
      setError(null);
      setStatus(ProcessStatus.IDLE);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!isValidVideoFile(file)) {
        setError(t('upload.errorFile'));
        return;
      }
      setVideoFile(file);
      setError(null);
      setStatus(ProcessStatus.IDLE);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setVideoFile(null);
    setStatus(ProcessStatus.IDLE);
    setError(null);
    setShowTranslateOption(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranslateFallback = async () => {
    setShowTranslateOption(false);
    setStatus(ProcessStatus.SEARCHING);
    setError(null);

    try {
        let englishSrt: string | null = null;
        let filenameBase = '';

        // Retry search with English
        if (lastSearchType === 'name') {
             filenameBase = searchQuery;
             englishSrt = await searchSubtitlesByName(searchQuery, 'English');
        } else if (lastSearchType === 'hash' && videoFile) {
             filenameBase = videoFile.name;
             englishSrt = await searchExistingSubtitles(videoFile, 'English');
        }

        if (englishSrt) {
            setStatus(ProcessStatus.PROCESSING);
            const progressInterval = startSimulatedProgress();
            
            // Translate
            const translated = await translateSrtContent(englishSrt, 'Portuguese (Brazil)');
             
            clearInterval(progressInterval);
            setProgress(100);
            setStatus(ProcessStatus.COMPLETE);
            
            onSuccess({
                fileName: `[PT-BR] ${filenameBase.replace(/(\.[^.]+$)/, '')}.srt`,
                content: translated,
                language: 'pt-BR',
                source: 'AI'
            });

        } else {
             setStatus(ProcessStatus.ERROR);
             setError(t('upload.errorEnglishNotFound'));
        }
    } catch (err) {
        console.error(err);
        setStatus(ProcessStatus.ERROR);
        setError(t('upload.errorFallbackFailed'));
    }
  };


  const handleSearchByName = async () => {
    if (!searchQuery.trim()) return;

    setStatus(ProcessStatus.SEARCHING);
    setError(null);
    setShowTranslateOption(false);
    setVideoFile(null); // Clear video file if searching by name

    try {
      const existingSrt = await searchSubtitlesByName(searchQuery, 'Portuguese (Brazil)');
      if (existingSrt) {
        setStatus(ProcessStatus.COMPLETE);
        onSuccess({
          fileName: searchQuery.replace(/[^a-zA-Z0-9]/g, "_") + ".srt",
          content: existingSrt,
          language: 'Portuguese (Brazil)',
          source: 'OpenSubtitles'
        });
        return;
      } else {
        setStatus(ProcessStatus.IDLE);
        setLastSearchType('name');
        setShowTranslateOption(true);
      }
    } catch (searchErr) {
      console.warn("Subtitle search failed", searchErr);
      setStatus(ProcessStatus.ERROR);
      setError(t('upload.errorSearchFailed'));
    }
  };

  const handleSubmit = async () => {
    if (!videoFile) return;

    setStatus(ProcessStatus.SEARCHING);
    setError(null);
    setShowTranslateOption(false);
    
    try {
      // Pass 'pt-br' or similar code expected by backend mapping
      const existingSrt = await searchExistingSubtitles(videoFile, 'Portuguese (Brazil)');
      if (existingSrt) {
        setStatus(ProcessStatus.COMPLETE);
        onSuccess({
          fileName: videoFile.name.replace(/\.[^/.]+$/, "") + ".srt",
          content: existingSrt,
          language: 'Portuguese (Brazil)',
          source: 'OpenSubtitles'
        });
        return;
      } else {
        setStatus(ProcessStatus.IDLE);
        setLastSearchType('hash');
        setShowTranslateOption(true);
      }
    } catch (searchErr) {
      console.warn("Subtitle search failed", searchErr);
      setStatus(ProcessStatus.ERROR);
      setError(t('upload.errorSearchFailed'));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('upload.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('upload.supported')}</p>
      </div>

      {!videoFile ? (
        <>
            <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 group"
            >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="video/*,.mkv,.avi,.mov,.wmv,.flv,.webm,.mp4,.m4v,.3gp,.ts" 
                className="hidden" 
            />
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">{t('upload.clickDrag')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">{t('upload.videoOnly')}</p>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="px-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{t('upload.or')}</span>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <div className="mt-6">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('upload.placeholderSearch')}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchByName()}
                    />
                    <button 
                        onClick={handleSearchByName}
                        disabled={status === ProcessStatus.SEARCHING || !searchQuery.trim()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('upload.btnSearch')}
                    </button>
                </div>
            </div>

            {(status === ProcessStatus.SEARCHING || status === ProcessStatus.PROCESSING) && (
                 <div className="mt-4 flex justify-center text-indigo-600 dark:text-indigo-400">
                    <span className="text-sm font-medium animate-pulse">
                        {status === ProcessStatus.PROCESSING ? t('upload.generating') : t('upload.searching')}
                    </span>
                 </div>
            )}

            {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {showTranslateOption && (
                <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">{t('fallback.title')}</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300">{t('fallback.description')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setShowTranslateOption(false);
                                setError(t('upload.cancelled')); 
                            }}
                            className="text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                        >
                            {t('fallback.no')}
                        </Button>
                        <Button 
                            onClick={handleTranslateFallback}
                            className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                        >
                            <Languages className="w-4 h-4 mr-2" />
                            {t('fallback.yes')}
                        </Button>
                    </div>
                </div>
            )}
        </>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg">
                <FileVideo className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{videoFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {status !== ProcessStatus.PROCESSING && status !== ProcessStatus.SEARCHING && (
              <button 
                onClick={clearFile}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={t('upload.remove')}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {status === ProcessStatus.SEARCHING && (
             <div className="mb-6 animate-pulse">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-2">
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('upload.searching')}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                   <div className="bg-indigo-500 h-1 w-1/3 rounded-full animate-[loading_1s_ease-in-out_infinite] translate-x-[-100%]"></div>
                </div>
             </div>
          )}

          {status === ProcessStatus.PROCESSING && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>{t('upload.generating')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">{t('upload.disclaimer')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {status === ProcessStatus.COMPLETE && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('upload.ready')}</p>
            </div>
          )}

          {showTranslateOption && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">{t('fallback.title')}</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{t('fallback.description')}</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            setShowTranslateOption(false);
                            setError(t('upload.errorFile')); // Just generic error or close
                        }}
                        className="text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                    >
                        {t('fallback.no')}
                    </Button>
                    <Button 
                        onClick={handleTranslateFallback}
                        className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                    >
                        <Languages className="w-4 h-4 mr-2" />
                        {t('fallback.yes')}
                    </Button>
                </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            {status === ProcessStatus.IDLE && !showTranslateOption && (
              <Button onClick={handleSubmit} className="w-full sm:w-auto">
                {t('upload.btnStart')}
              </Button>
            )}
            {(status === ProcessStatus.PROCESSING || status === ProcessStatus.SEARCHING) && (
              <Button disabled isLoading className="w-full sm:w-auto">
                {status === ProcessStatus.SEARCHING ? t('upload.btnSearching') : t('upload.btnProcessing')}
              </Button>
            )}
            {status === ProcessStatus.ERROR && !showTranslateOption && (
              <Button onClick={handleSubmit} variant="secondary" className="w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('upload.btnTryAgain')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
