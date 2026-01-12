import React, { useState } from 'react';
import { UploadForm } from './components/UploadForm';
import { TranslateForm } from './components/TranslateForm';
import { ResultDisplay } from './components/ResultDisplay';
import { SubtitleResult } from './types';
import { Sparkles, Github, Globe, Moon, Sun, Video, FileText } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const MainApp: React.FC = () => {
  const [result, setResult] = useState<SubtitleResult | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'srt'>('video');
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#0f172a] dark:to-[#0f172a] text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-500 dark:from-white dark:to-slate-400">
              SubGen AI
            </span>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="flex items-center space-x-2">
                 {/* Language Toggle */}
                <button 
                    onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={language === 'en' ? "Mudar para Português" : "Switch to English"}
                >
                    <span className="font-bold text-xs">{language.toUpperCase()}</span>
                </button>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            
            <a href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {!result ? (
          <div className="space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
                <Globe className="w-3 h-3 mr-2" />
                {t('hero.poweredBy')}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('hero.titlePart1')} <span className="text-indigo-600 dark:text-indigo-500">{t('hero.titleHighlight')}</span> <br/>{t('hero.titlePart2')}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t('hero.description')}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex space-x-1">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'video'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {t('tabs.video')}
                </button>
                <button
                  onClick={() => setActiveTab('srt')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'srt'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('tabs.srt')}
                </button>
              </div>
            </div>

            {activeTab === 'video' ? (
              <UploadForm onSuccess={setResult} />
            ) : (
              <TranslateForm onSuccess={setResult} />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-center text-slate-600 dark:text-slate-400">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-2">{t('features.dragCheck')}</h3>
                    <p className="text-sm">{t('features.dragDesc')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-2">{t('features.aiTrans')}</h3>
                    <p className="text-sm">{t('features.aiDesc')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-2">{t('features.instantDl')}</h3>
                    <p className="text-sm">{t('features.instantDesc')}</p>
                </div>
            </div>
          </div>
        ) : (
          <ResultDisplay result={result} onReset={() => setResult(null)} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} {t('footer.text')}</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <MainApp />
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
