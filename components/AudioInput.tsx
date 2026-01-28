
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Square, FileAudio } from 'lucide-react';
import { blobToBase64 } from '../utils/audio';

interface AudioInputProps {
  onAudioReady: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

const AudioInput: React.FC<AudioInputProps> = ({ onAudioReady, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        onAudioReady(base64, 'audio/webm');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Нет доступа к микрофону.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      onAudioReady(base64, file.type);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-[0_25px_70px_-15px_rgba(16,185,129,0.12)] border border-emerald-50/50 p-8 md:p-14 transition-all overflow-hidden relative">
      <div className="flex flex-col items-center space-y-12 relative z-10">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Запишите голос
          </h2>
          <p className="text-gray-400 text-lg font-medium max-w-sm mx-auto leading-relaxed">
            Мгновенная трансформация вашей речи в четкие выводы и задачи
          </p>
        </div>

        <div className="flex flex-col items-center space-y-10 w-full max-w-md">
          {/* Главная кнопка записи */}
          <div className="relative">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className={`w-36 h-36 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 group relative ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                <Mic className="w-14 h-14 text-white relative z-10" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-36 h-36 rounded-full bg-rose-500 flex flex-col items-center justify-center shadow-2xl shadow-rose-200 animate-pulse active:scale-95 group"
              >
                <Square className="w-10 h-10 text-white fill-white mb-2" />
                <span className="text-sm font-black text-white tabular-nums tracking-tighter">{formatTime(recordTime)}</span>
              </button>
            )}
            <div className="mt-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 opacity-60">
                {!isRecording ? 'Начать запись' : 'Завершить'}
              </span>
            </div>
          </div>

          <div className="w-full flex items-center space-x-4">
             <div className="h-px flex-grow bg-gray-100"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">или</span>
             <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          {/* Кнопка загрузки файла */}
          <label className={`w-full flex items-center justify-center space-x-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:border-emerald-200 cursor-pointer group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
            <FileAudio className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Загрузить файл</span>
            <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
      
      {/* Декоративный элемент фона */}
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default AudioInput;
