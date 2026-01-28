import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '');
  
  // Пытаемся найти ключ под разными именами (GROQ_API_KEY, GEMINI_API_KEY или API_KEY)
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY ||
                 env.GROQ_API_KEY || env.GEMINI_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Это критически важно: передаем ключ в код приложения, 
      // чтобы библиотека @google/genai могла его прочитать через process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})