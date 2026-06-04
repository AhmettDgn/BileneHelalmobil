/**
 * Google Gemini API Client for React Native.
 * Uses native fetch to avoid dependency compatibility issues on iOS/Android.
 */

export const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.5-flash';

// Define the response schema to send to Gemini for structured output
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          options: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          correctOptionIndex: { type: 'INTEGER' },
        },
        required: ['text', 'options', 'correctOptionIndex'],
      },
    },
  },
  required: ['questions'],
};

interface GenerateContentParams {
  prompt: string;
  pdfBase64?: string;
}

export async function generateContent({ prompt, pdfBase64 }: GenerateContentParams): Promise<string> {
  // Use EXPO_PUBLIC_ prefix first, then fallback to non-prefixed key if loaded in Node context (e.g. tests)
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API anahtarı bulunamadı (EXPO_PUBLIC_GEMINI_API_KEY env dosyasında tanımlı olmalı).');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: prompt }];

  if (pdfBase64) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP hata kodu: ${response.status}`;
    throw new Error(`Gemini API isteği başarısız oldu: ${message}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API boş bir yanıt döndürdü.');
  }

  return text;
}
