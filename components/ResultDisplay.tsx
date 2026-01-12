import React from 'react';
import { Download, FileText, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { SubtitleResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultDisplayProps {
  result: SubtitleResult;
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  const [copied, setCopied] = React.useState(false);
  const { t } = useLanguage();

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([result.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = result.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('result.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {result.fileName}
            </p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
             <Button variant="secondary" onClick={onReset} className="w-full sm:w-auto">
              {t('result.btnAnother')}
            </Button>
            <Button onClick={handleDownload} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {t('result.btnDownload')}
            </Button>
          </div>
        </div>

        <div className="relative">
            <div className="absolute top-4 right-4 z-10">
                 <button 
                    onClick={handleCopy}
                    className="p-2 bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-300 dark:border-slate-600 backdrop-blur"
                    title="Copy to clipboard"
                 >
                     {copied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                 </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{t('result.preview')}</span>
                    <span className="text-xs text-indigo-500 dark:text-indigo-400">{result.language}</span>
                </div>
                <pre className="p-6 overflow-x-auto text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {result.content}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
};
