import React, { useState } from 'react';
import { BriefingResult } from '../types';
import { 
  CheckCircle2, Sparkles, Target, 
  FileText, Printer, Copy, Quote, LayoutDashboard, FileAudio
} from 'lucide-react';

interface AnalysisResultProps {
  data: BriefingResult;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'transcript'>('report');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Парсинг транскрипции для отображения в виде чата
  const parsedTranscript = React.useMemo(() => {
    const lines = data.transcription.split('\n').filter(line => line.trim() !== '');
    return lines.map((line) => {
      // Пытаемся найти паттерн "Спикер X:" или "Имя:"
      const match = line.match(/^((?:Спикер \d+|[^:]+)):(.*)/i);
      if (match) {
        return {
          speaker: match[1].trim(),
          text: match[2].trim(),
          isHeader: true
        };
      }
      return {
        speaker: null,
        text: line,
        isHeader: false
      };
    });
  }, [data.transcription]);

  const getSentimentStyle = (sentiment: string) => {
    const s = sentiment?.toLowerCase() || '';
    if (s.includes('позитив') || s.includes('продуктив')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('негатив') || s.includes('напряжен')) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(type);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const handleExportWord = () => {
     const content = `
      <html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Voxly Report</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">Отчет Voxly</h1>
        <p><strong>Тональность:</strong> ${data.sentiment}</p>
        
        <h2 style="color: #374151;">Исполнительное резюме</h2>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
            ${data.summary}
        </div>

        <h2 style="color: #374151;">Ключевые инсайты</h2>
        <ul>${data.keyPoints.map(p => `<li style="margin-bottom: 8px;">${p}</li>`).join('')}</ul>

        <h2 style="color: #374151;">План действий</h2>
        <ul>${data.actionItems.map(item => `<li style="margin-bottom: 8px;">[ ] ${item}</li>`).join('')}</ul>
        
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
        <p style="color: #9ca3af; font-size: 12px;">Сгенерировано с помощью Voxly</p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voxly_Briefing_${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePlainText = () => {
    return `ОТЧЕТ VOXLY\n\n` +
      `РЕЗЮМЕ:\n${data.summary}\n\n` +
      `ИНСАЙТЫ:\n${data.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
      `ЗАДАЧИ:\n${data.actionItems.map(item => `[ ] ${item}`).join('\n')}`;
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn pb-20">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="sticky top-0 z-30 bg-[#fcfdfc]/80 backdrop-blur-md py-6 mb-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200">
                <LayoutDashboard className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Результат анализа</h2>
                <div className="flex items-center gap-2 mt-2">
                   <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getSentimentStyle(data.sentiment)}`}>
                     {data.sentiment}
                   </span>
                   <span className="text-gray-400 text-xs font-medium">• {data.transcription.length} симв.</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-gray-100/80 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('report')}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'report' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Бриф</span>
                </button>
                <button 
                  onClick={() => setActiveTab('transcript')}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'transcript' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileAudio className="w-4 h-4" />
                  <span>Текст</span>
                </button>
             </div>

             <div className="h-8 w-px bg-gray-200 mx-2"></div>

             <button onClick={handleExportWord} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm group relative" title="Скачать Word">
                <FileText className="w-5 h-5" />
             </button>
             <button onClick={() => window.print()} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm" title="Печать">
                <Printer className="w-5 h-5" />
             </button>
             <button onClick={() => copyToClipboard(generatePlainText(), 'all')} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm relative" title="Копировать">
                <Copy className="w-5 h-5" />
                {copyStatus === 'all' && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded">Скопировано!</span>}
             </button>
             
             <button onClick={onReset} className="ml-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-gray-200">
                Заново
             </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-grow">
        {activeTab === 'report' ? (
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 animate-fadeIn">
            
            {/* SUMMARY CARD (FULL WIDTH) */}
            <div className="col-span-1 md:col-span-6 lg:col-span-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
               
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                      <Quote className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Главное за 30 секунд</span>
                    </div>
                    <p className="text-xl md:text-2xl font-medium leading-relaxed tracking-tight text-emerald-50">
                      {data.summary}
                    </p>
                  </div>
                  
                  <div className="mt-8 flex flex-wrap gap-2">
                    {data.mainThemes.map((theme, i) => (
                      <span key={i} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-bold tracking-wide">
                        #{theme}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            {/* SENTIMENT & META CARD */}
            <div className="col-span-1 md:col-span-6 lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
               <div>
                  <div className="flex items-center gap-3 mb-6 text-gray-400">
                    <Target className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Фокус внимания</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span className="text-sm font-bold text-gray-500">Задач</span>
                        <span className="text-xl font-black text-gray-900">{data.actionItems.length}</span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span className="text-sm font-bold text-gray-500">Инсайтов</span>
                        <span className="text-xl font-black text-gray-900">{data.keyPoints.length}</span>
                     </div>
                  </div>
               </div>
               <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Вердикт</span>
                  <span className="text-lg font-bold">{data.sentiment}</span>
               </div>
            </div>

            {/* KEY POINTS (LEFT COLUMN) */}
            <div className="col-span-1 md:col-span-6 lg:col-span-7 bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-lg shadow-gray-100/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Инсайты и факты</h3>
               </div>
               <div className="space-y-6">
                  {data.keyPoints.map((point, i) => (
                    <div key={i} className="flex gap-4 group">
                       <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 text-xs font-black border border-amber-100 mt-0.5 group-hover:scale-110 transition-transform">
                          {i + 1}
                       </span>
                       <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                          {point}
                       </p>
                    </div>
                  ))}
               </div>
            </div>

            {/* ACTION ITEMS (RIGHT COLUMN) */}
            <div className="col-span-1 md:col-span-6 lg:col-span-5 bg-[#f8fafc] rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-inner">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Список задач</h3>
               </div>
               <div className="space-y-3">
                  {data.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                       <div className="mt-1 flex-shrink-0 text-gray-300 hover:text-emerald-500 transition-colors">
                          <div className="w-5 h-5 rounded-md border-2 border-current"></div>
                       </div>
                       <span className="text-sm font-bold text-gray-700 leading-snug">{item}</span>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        ) : (
          /* --- TRANSCRIPT TAB --- */
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/40 p-4 md:p-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 rounded-lg">
                    <FileAudio className="w-5 h-5 text-emerald-600" />
                 </div>
                 <h3 className="font-bold text-gray-900">Транскрипция</h3>
              </div>
              <button 
                onClick={() => copyToClipboard(data.transcription, 'transcript')}
                className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
              >
                {copyStatus === 'transcript' ? 'Скопировано!' : 'Копировать все'}
              </button>
            </div>

            <div className="space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar px-2 md:px-4 pb-10">
              {parsedTranscript.map((block, i) => (
                 block.speaker ? (
                   <div key={i} className="flex gap-4 group">
                      <div className="flex-shrink-0 mt-1">
                         <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs border border-white shadow-sm">
                            {block.speaker.charAt(block.speaker.length - 1)}
                         </div>
                      </div>
                      <div className="flex-grow">
                         <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wide">{block.speaker}</span>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl rounded-tl-none text-gray-700 leading-relaxed border border-gray-100 group-hover:bg-emerald-50/30 group-hover:border-emerald-100 transition-colors">
                            {block.text}
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div key={i} className="pl-14 text-gray-600 leading-relaxed">
                      {block.text}
                   </div>
                 )
              ))}
              
              {parsedTranscript.length === 0 && (
                 <p className="text-gray-500 italic text-center py-10">
                    Текст отображается как сплошной блок. Попробуйте перезапустить анализ для форматирования.
                    <br/><br/>
                    {data.transcription}
                 </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;