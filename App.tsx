import React, { useState, useEffect } from 'react';
import { UserPortfolio } from './types';
import { INITIAL_PORTFOLIO } from './constants';
import InputSection from './components/InputSection';
import AnalysisView from './components/AnalysisView';
import { generatePortfolioAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<'input' | 'analysis'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<UserPortfolio>(INITIAL_PORTFOLIO);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTimeET = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(date);
  };

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await generatePortfolioAnalysis(portfolio);
      setAnalysisResult(result);
      setStep('analysis');
    } catch (error) {
      alert("Error generating analysis. Please ensure you have a valid internet connection and API key.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setAnalysisResult('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Harmonia Finance
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs sm:text-sm font-mono text-emerald-400 font-medium tracking-tight">
              {formatDateTimeET(currentTime)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Powered by Gemini 2.5 Flash
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Banner (only on input) */}
        {step === 'input' && !isLoading && (
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-3">
              Institutional-Grade Portfolio Analysis
            </h2>
            <p className="text-slate-400 italic">
              Combines <span className="font-semibold">Technical</span>, <span className="font-semibold">Macro</span>, and <span className="font-semibold">Psychology</span> pillars with real-time data to optimize your capital deployment.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analyzing Markets...</h3>
            <p className="text-slate-400 text-sm max-w-md text-center">
              Fetching real-time CPI, Yields, VIX, and performing technical analysis on your watchlist.
            </p>
          </div>
        )}

        {/* Input Form */}
        {!isLoading && step === 'input' && (
          <InputSection 
            portfolio={portfolio} 
            setPortfolio={setPortfolio} 
            onSubmit={handleGenerateAnalysis}
            isLoading={isLoading}
          />
        )}

        {/* Results View */}
        {!isLoading && step === 'analysis' && (
          <AnalysisView 
            portfolio={portfolio} 
            analysis={analysisResult} 
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
};

export default App;