import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { ProcessStatus, SubtitleResult } from '../types';
import { translateSrtContent } from '../services/translationService';
import { useLanguage } from '../contexts/LanguageContext';

interface TranslateFormProps {
  onSuccess: (result: SubtitleResult) => void;
}

export const TranslateForm: React.FC<TranslateFormProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
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

  const isValidSrtFile = (file: File) => {
    return file.name.toLowerCase().endsWith('.srt');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isValidSrtFile(file)) {
        setError(t('translate.errorFile'));
        return;
      }
      setSrtFile(file);
      setError(null);
      setStatus(ProcessStatus.IDLE);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!isValidSrtFile(file)) {
        setError(t('translate.errorFile'));
        return;
      }
      setSrtFile(file);
      setError(null);
      setStatus(ProcessStatus.IDLE);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveFile = () => {
    setSrtFile(null);
    setStatus(ProcessStatus.IDLE);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranslate = async () => {
    if (!srtFile) return;

    try {
      setStatus(ProcessStatus.PROCESSING);
      const progressInterval = startSimulatedProgress();
      setError(null);

      // Read file content
      const text = await srtFile.text();
      
      // Translate
      const translatedContent = await translateSrtContent(text, 'Portuguese (Brazil)');
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatus(ProcessStatus.COMPLETE);

      onSuccess({
        fileName: `[PT-BR] ${srtFile.name}`,
        content: translatedContent,
        language: 'pt-BR',
        source: 'AI'
      });

    } catch (err) {
      console.error('Translation error:', err);
      setStatus(ProcessStatus.ERROR);
      setError(t('translate.errorGeneric'));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
          status === ProcessStatus.ERROR ? 'border-red-500 bg-red-50/10' :
          status === ProcessStatus.COMPLETE ? 'border-green-500 bg-green-50/10' :
          srtFile ? 'border-blue-500 bg-blue-50/5' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".srt"
          className="hidden"
        />

        {status === ProcessStatus.IDLE && !srtFile && (
          <div 
            className="flex flex-col items-center justify-center cursor-pointer py-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-gray-800 p-4 rounded-full mb-4">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('translate.title')}</h3>
            <p className="text-gray-400 mb-2">{t('translate.clickDrag')}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{t('translate.supported')}</p>
          </div>
        )}

        {srtFile && status === ProcessStatus.IDLE && (
          <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">{srtFile.name}</p>
                <p className="text-xs text-gray-400">{(srtFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              title={t('translate.remove')}
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        )}

        {status === ProcessStatus.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-4">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  className="text-gray-700"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="32"
                  cy="32"
                />
                <circle
                  className="text-blue-500 transition-all duration-300 ease-out"
                  strokeWidth="4"
                  strokeDasharray={188}
                  strokeDashoffset={188 - (188 * progress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="32"
                  cy="32"
                />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-400">{Math.round(progress)}%</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{t('translate.translating')}</h3>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              {t('upload.disclaimer')}
            </p>
          </div>
        )}

        {status === ProcessStatus.COMPLETE && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-500/20 p-4 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('translate.ready')}</h3>
          </div>
        )}

        {status === ProcessStatus.ERROR && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-red-500/20 p-4 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('translate.errorTitle')}</h3>
            <p className="text-red-300 text-center mb-4 max-w-md">{error}</p>
            <Button 
              onClick={() => {
                setStatus(ProcessStatus.IDLE);
                setError(null);
              }}
              variant="secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('upload.btnTryAgain')}
            </Button>
          </div>
        )}
      </div>

      {status === ProcessStatus.IDLE && srtFile && (
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={handleTranslate}
            className="w-full sm:w-auto min-w-[200px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('translate.btnStart')}
          </Button>
        </div>
      )}
    </div>
  );
};
