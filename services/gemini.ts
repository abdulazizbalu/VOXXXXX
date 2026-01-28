
import { GoogleGenAI, Type } from "@google/genai";
import { BriefingResult } from "../types";

// Безопасное получение ключа с поддержкой разных сборщиков (Vite, CRA, Cloudflare)
const getApiKey = () => {
  let key = "";

  // 1. Пробуем стандарт Vite (наиболее вероятно для этого проекта)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 2. Если не нашли, пробуем process.env (для Node.js или совместимых сборщиков)
  if (!key) {
    try {
      if (typeof process !== "undefined" && process.env) {
        key = process.env.VITE_API_KEY || process.env.API_KEY || process.env.REACT_APP_API_KEY || "";
      }
    } catch (e) {}
  }

  return key;
};

const API_KEY = getApiKey();

// Логирование для отладки (не выводит сам ключ целиком ради безопасности)
console.log("Voxly System Check:");
console.log("- API Key detected:", API_KEY ? "YES (Ends with ... " + API_KEY.slice(-4) + ")" : "NO");

/**
 * Транскрибация аудио
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    const errorMsg = "API Ключ не найден. Убедитесь, что в Cloudflare Settings -> Environment Variables добавлена переменная VITE_API_KEY.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: `
            Ты — профессиональный стенографист. Твоя задача — транскрибировать аудиофайл в текст на русском языке.
            
            ВАЖНЫЕ ИНСТРУКЦИИ:
            1. Разделяй реплики разных людей. Используй формат: "Спикер 1: [Текст]", "Спикер 2: [Текст]".
            2. Если спикер один, просто раздели текст на логические абзацы.
            3. Сохраняй смысловую точность, но убирай слова-паразиты, если они не несут смысла.
            4. Расставь знаки препинания для идеальной читаемости.
            
            Верни ТОЛЬКО текст транскрипции.
          ` }
        ]
      }
    });

    if (!response.text) {
      throw new Error("Модель вернула пустой ответ.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Transcription Error:", error);
    // Пробрасываем ошибку с понятным описанием
    if (error.message && error.message.includes("API key")) {
        throw new Error("Неверный API ключ. Проверьте правильность ключа в Cloudflare.");
    }
    throw new Error(error.message || "Ошибка при транскрибации");
  }
};

/**
 * Глубокий анализ текста (Резюме, Темы, Выводы, Задачи)
 */
export const performDeepAnalysis = async (transcription: string): Promise<Omit<BriefingResult, 'transcription'>> => {
  if (!API_KEY) throw new Error("API_KEY не найден.");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-3-pro-preview';

  const analysisPrompt = `
    Проведи глубокий аналитический разбор следующего текста (транскрипции встречи или записи):
    
    """
    ${transcription}
    """

    Твоя задача — структурировать информацию так, чтобы человек мог за 30 секунд понять суть и узнать, что делать дальше.
    
    1. **Исполнительное резюме (summary)**: 2-3 мощных предложения, описывающих суть.
    2. **Основные темы (mainThemes)**: 3-5 тегов.
    3. **Ключевые инсайты (keyPoints)**: Список фактов и выводов.
    4. **Задачи (actionItems)**: Конкретные действия (что сделать).
    5. **Тональность (sentiment)**: Оценка атмосферы.

    ОТВЕТЬ СТРОГО В ФОРМАТЕ JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: analysisPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            mainThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING }
          },
          required: ["summary", "mainThemes", "keyPoints", "actionItems", "sentiment"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      ...parsed,
      emotions: [],
      emotionsData: []
    };
  } catch (error: any) {
     console.error("Analysis Error:", error);
     throw new Error(error.message || "Ошибка при анализе текста");
  }
};
