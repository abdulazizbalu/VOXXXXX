import { GoogleGenAI, Type } from "@google/genai";
import { BriefingResult } from "../types";

/**
 * Транскрибация аудио
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.0-flash';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: `
            Ты — профессиональный стенографист. Твоя задача — транскрибировать аудиофайл в текст на русском языке.
            
            ВАЖНЫЕ ИНСТРУКЦИИ:
            1. Верни ТОЛЬКО текст транскрипции.
            2. Разделяй реплики спикеров новой строкой. Если возможно, указывай "Спикер 1:", "Спикер 2:".
            3. Игнорируй фоновые шумы и неречевые звуки.
          ` }
        ]
      }
    });

    if (!response.text) {
      throw new Error("Пустой ответ от модели (возможно, аудио слишком короткое или тихое).");
    }

    return response.text;
  } catch (error: any) {
    console.error("Transcription Error:", error);
    throw new Error(`Ошибка транскрибации: ${error.message}`);
  }
};

/**
 * Глубокий анализ текста (Резюме, Темы, Выводы, Задачи)
 */
export const performDeepAnalysis = async (transcription: string): Promise<Omit<BriefingResult, 'transcription'>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.0-flash';

  const analysisPrompt = `
    Проанализируй следующий текст транскрипции и подготовь профессиональный отчет.
    
    Текст для анализа:
    """
    ${transcription.substring(0, 50000)} 
    """
    
    Требования к отчету (JSON):
    1. summary: Краткое, емкое резюме сути разговора (3-4 предложения).
    2. mainThemes: Список из 3-6 основных тем или тегов.
    3. keyPoints: 3-7 ключевых фактов, инсайтов или важных моментов.
    4. actionItems: Конкретные задачи, поручения или следующие шаги.
    5. sentiment: Общая эмоциональная окраска (например: "Позитивная", "Деловая", "Напряженная").
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: analysisPrompt,
      config: {
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