import React, { useState } from 'react';
import Header from './components/Header';
import AudioInput from './components/AudioInput';
import AnalysisResult from './components/AnalysisResult';
import { transcribeAudio, performDeepAnalysis } from './services/gemini';
import { BriefingResult, ProcessingStatus } from './types';
import { Sparkles, BrainCircuit, Waves, CheckCircle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<BriefingResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', message: '' });

  const handleProcessInput = async (type: 'audio' | 'text', data: string, mimeType?: string) => {
    try {
      setAnalysisResult(null);
      
      let transcription = '';

      if (type === 'audio') {
        setStatus({ step: 'transcribing', message: 'Расшифровываем аудиодорожку...' });
        // Для аудио сначала делаем транскрибацию
        transcription = await transcribeAudio(data, mimeType || 'audio/webm');
      } else {
        // Для текста сразу используем введенные данные
        transcription = data;
      }
      
      setStatus({ step: 'analyzing', message: 'Глубокий нейросетевой анализ...' });
      const analysis = await performDeepAnalysis(transcription);
      
      setAnalysisResult({
        transcription,
        ...analysis
      });
      setStatus({ step: 'completed', message: 'Готово!' });
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Произошла ошибка.';
      if (err.message) {
        if (err.message.includes('API_KEY') || err.message.includes('API ключ')) errorMsg = 'Не настроен API ключ. Добавьте GROQ_API_KEY в Cloudflare Pages → Settings → Environment Variables.';
        else if (err.message.includes('400')) errorMsg = 'Ошибка запроса (возможно, контент слишком большой).';
        else if (err.message.includes('429')) errorMsg = 'Слишком много запросов. Попробуйте позже.';
        else errorMsg = err.message;
      }
      setStatus({ step: 'error', message: errorMsg });
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setStatus({ step: 'idle', message: '' });
  };

  const isProcessing = status.step !== 'idle' && status.step !== 'completed' && status.step !== 'error';

  const getProgress = () => {
    switch (status.step) {
      case 'transcribing': return 35;
      case 'analyzing': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-16">
        <div className="space-y-12">
          
          {/* Main Input Stage */}
          {!analysisResult && !isProcessing && (
            <div className="max-w-3xl mx-auto w-full animate-fadeIn">
              <AudioInput onInputReady={handleProcessInput} isProcessing={isProcessing} />
            </div>
          )}

          {/* Interactive Processing State */}
          {isProcessing && (
            <div className="max-w-3xl mx-auto bg-white rounded-[3.5rem] border border-emerald-50 p-16 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center space-y-12 animate-fadeIn overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-50 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-in-out thinking-shimmer"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>

              <div className="relative">
                {/* Анимированный ореол */}
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping scale-150 opacity-20"></div>
                
                <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-xl relative z-10 border border-emerald-50">
                  <div className="absolute inset-2 border-2 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
                  
                  {status.step === 'transcribing' ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <Waves className="w-12 h-12 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <BrainCircuit className="w-12 h-12 text-emerald-500 animate-[bounce_2s_infinite]" />
                    </div>
                  )}
                </div>
                
                <div className="absolute -top-4 -right-4 bg-emerald-500 p-3 rounded-2xl shadow-lg border-4 border-white animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="text-center space-y-6 max-w-sm">
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    {status.message}
                  </h3>
                  <p className="text-emerald-600 font-bold text-xs uppercase tracking-[0.25em] animate-pulse">
                    Gemini 3 работает для вас
                  </p>
                </div>
                
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Это может занять несколько секунд, мы извлекаем самую ценную информацию.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="w-full max-w-md pt-4">
                <div className="grid grid-cols-3 gap-8">
                  {[
                    { label: 'Данные', active: status.step === 'transcribing' || status.step === 'analyzing', icon: Waves },
                    { label: 'Анализ', active: status.step === 'analyzing', icon: BrainCircuit },
                    { label: 'Финиш', active: status.step === 'completed', icon: CheckCircle }
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center space-y-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${s.active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 rotate-0 scale-110' : 'bg-gray-50 text-gray-300 -rotate-12 scale-90'}`}>
                        <s.icon className={`w-6 h-6 ${s.active ? 'animate-pulse' : ''}`} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${s.active ? 'text-emerald-600' : 'text-gray-300'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status.step === 'error' && (
            <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-rose-100 p-12 text-center shadow-xl shadow-rose-100/20 animate-fadeIn">
              <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Что-то пошло не так</h3>
              <p className="text-gray-500 mb-8">{status.message}</p>
              <button 
                onClick={handleReset}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Results Stage */}
          {analysisResult && (
            <AnalysisResult data={analysisResult} onReset={handleReset} />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;