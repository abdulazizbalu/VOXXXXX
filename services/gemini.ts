import { BriefingResult } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1";

/**
 * Конвертация base64 в Blob для отправки в Whisper API
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Транскрибация аудио через Groq Whisper
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API ключ не настроен. Добавьте GROQ_API_KEY в настройки.");
  }

  try {
    // Конвертируем base64 в Blob
    const audioBlob = base64ToBlob(base64Audio, mimeType);

    // Определяем расширение файла
    const extension = mimeType.includes('webm') ? 'webm' :
                      mimeType.includes('mp3') ? 'mp3' :
                      mimeType.includes('wav') ? 'wav' :
                      mimeType.includes('m4a') ? 'm4a' : 'webm';

    // Создаем FormData для отправки
    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ru');
    formData.append('response_format', 'text');

    const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ошибка Whisper API: ${response.status} - ${error}`);
    }

    const transcription = await response.text();

    if (!transcription || transcription.trim() === '') {
      throw new Error("Пустой ответ от модели (возможно, аудио слишком короткое или тихое).");
    }

    return transcription;
  } catch (error: any) {
    console.error("Transcription Error:", error);
    throw new Error(`Ошибка транскрибации: ${error.message}`);
  }
};

/**
 * Глубокий анализ текста через Groq LLaMA
 */
export const performDeepAnalysis = async (transcription: string): Promise<Omit<BriefingResult, 'transcription'>> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API ключ не настроен. Добавьте GROQ_API_KEY в настройки.");
  }

  const analysisPrompt = `Проанализируй следующий текст транскрипции и подготовь профессиональный отчет.

Текст для анализа:
"""
${transcription.substring(0, 30000)}
"""

Верни ответ СТРОГО в формате JSON (без markdown, без \`\`\`):
{
  "summary": "Краткое резюме (3-4 предложения)",
  "mainThemes": ["тема1", "тема2", "тема3"],
  "keyPoints": ["факт1", "факт2", "факт3"],
  "actionItems": ["задача1", "задача2"],
  "sentiment": "Эмоциональная окраска (Позитивная/Деловая/Нейтральная/Напряженная)"
}`;

  try {
    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ты - профессиональный аналитик. Отвечай только валидным JSON без markdown форматирования.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ошибка Groq API: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || "Не удалось сформировать резюме.",
      mainThemes: parsed.mainThemes || [],
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      sentiment: parsed.sentiment || "Нейтрально",
      emotions: [],
      emotionsData: []
    };
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(`Ошибка анализа: ${error.message}`);
  }
};
