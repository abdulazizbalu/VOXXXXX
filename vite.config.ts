import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, '.', '');
  
  // Ищем ключ API_KEY, GEMINI_API_KEY или (как fallback) GROQ_API_KEY
  const apiKey = process.env.API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.GROQ_API_KEY || env.GROQ_API_KEY;

  return {
    plugins: [react()],
    define: {
      // Передаем ключ в приложение.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})