import { GoogleGenAI, Type } from "@google/genai";
import { BriefingResult } from "../types";

/**
 * Транскрибация аудио через Gemini 2.0
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Используем Gemini 2.0 Flash — быстрая и мультимодальная модель
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe this audio file into text. Return only the transcription text without any additional comments.",
          },
        ],
      },
    });

    if (!response.text) {
      throw new Error("Пустой ответ от модели.");
    }
    return response.text;

  } catch (error: any) {
    console.error("Transcription Error:", error);
    throw new Error(`Ошибка транскрибации: ${error.message}`);
  }
};

/**
 * Глубокий анализ текста через Gemini 2.0
 */
export const performDeepAnalysis = async (transcription: string): Promise<Omit<BriefingResult, 'transcription'>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Gemini 2.0 Flash отлично справляется с аналитикой и JSON
  const model = 'gemini-2.0-flash-exp';

  const systemInstruction = `
    Ты — профессиональный бизнес-аналитик. Твоя задача — проанализировать текст встречи и выдать структурированный JSON.
  `;

  const prompt = `
    Проанализируй следующий текст:
    """
    ${transcription}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Краткое резюме (3-4 предложения).",
            },
            mainThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Список основных тем (3-5 тем).",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Ключевые факты и инсайты (3-7 пунктов).",
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Конкретные задачи и следующие шаги.",
            },
            sentiment: {
              type: Type.STRING,
              description: "Тональность разговора (например: 'Позитивная', 'Напряженная').",
            },
          },
          required: ["summary", "mainThemes", "keyPoints", "actionItems", "sentiment"],
        },
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("Пустой ответ от модели.");
    }

    const parsed = JSON.parse(text);

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