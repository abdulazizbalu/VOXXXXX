import { GoogleGenAI, Type } from "@google/genai";
import { BriefingResult } from "../types";

/**
 * Транскрибация аудио
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            1. Верни ТОЛЬКО текст транскрипции.
            2. Разделяй реплики, если слышишь разных людей (Спикер 1, Спикер 2).
            3. Не добавляй никаких вступительных слов вроде "Вот транскрипция".
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
  // Используем Pro модель для сложного анализа
  const model = 'gemini-3-pro-preview';

  const analysisPrompt = `
    Проанализируй этот текст:
    """
    ${transcription.substring(0, 50000)} 
    """

    Создай структурированный отчет в формате JSON:
    1. summary: Краткое резюме (2-3 предложения).
    2. mainThemes: 3-5 основных тем (тэги).
    3. keyPoints: 3-5 ключевых инсайтов или фактов.
    4. actionItems: Список конкретных задач/действий.
    5. sentiment: Тональность разговора (одно слово/фраза).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: analysisPrompt,
      config: {
        // Thinking config помогает для сложного анализа, но требует времени.
        // Бюджет токенов для размышления.
        thinkingConfig: { thinkingBudget: 2048 },
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
      summary: parsed.summary || "Нет данных",
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