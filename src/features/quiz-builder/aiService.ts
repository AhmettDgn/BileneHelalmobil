import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { generateContent } from '@/lib/gemini/client';
import type { QuestionDraft } from './quizService';

type Difficulty = 'kolay' | 'orta' | 'zor';

export interface GenerateAiQuestionsParams {
  topic?: string;
  pdfUri?: string;
  pdfFile?: File | null; // For web support if available
  count: number;
  difficulty: Difficulty;
  defaultTimeLimitSeconds: number;
  defaultPoints: number;
}

const MIN_TIME_LIMIT = 5;
const MAX_TIME_LIMIT = 300;
const MIN_POINTS = 1;
const MAX_POINTS = 1000;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Normalizes questions returned from Gemini into the QuestionDraft format expected by the database.
 */
function normalizeGeneratedQuestion(
  item: unknown,
  defaults: { time_limit_seconds: number; points: number }
): QuestionDraft | null {
  if (!isRecord(item)) return null;

  const text = typeof item.text === 'string' ? item.text.trim() : '';
  if (!text) return null;

  if (!Array.isArray(item.options)) return null;
  const options = item.options
    .filter((option): option is string => typeof option === 'string')
    .map((option) => option.trim())
    .slice(0, 4);

  if (options.length < 2 || options.some((option) => option.length === 0)) {
    return null;
  }

  // Gemini returns correctOptionIndex (camelCase)
  const rawIndex =
    typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : 0;
  const correct_option_index = clamp(
    Math.floor(rawIndex),
    0,
    options.length - 1
  );

  return {
    text,
    options,
    correct_option_index,
    time_limit_seconds: defaults.time_limit_seconds,
    points: defaults.points,
  };
}

/**
 * Prompts construction.
 */
function buildPrompt(params: {
  count: number;
  difficulty: Difficulty;
  topic: string;
  hasPdf: boolean;
}): string {
  const { count, difficulty, topic, hasPdf } = params;
  const sourceLines: string[] = [];
  if (hasPdf) {
    sourceLines.push('- Ekteki PDF dosyasının içeriğini analiz et.');
  }
  if (topic) {
    sourceLines.push(`- Şu konuyu/talimatı dikkate al: "${topic}"`);
  }

  return [
    'Sen bir quiz/yarışma sorusu hazırlama uzmanısın.',
    'Aşağıdaki kaynaktan çoktan seçmeli sorular üret:',
    ...sourceLines,
    '',
    'Kurallar:',
    `- Tam olarak ${count} adet soru üret.`,
    '- Her sorunun TAM 4 seçeneği olsun ve yalnızca biri doğru olsun.',
    '- "correctOptionIndex" 0 ile 3 arasında, doğru seçeneğin sırasını belirtir.',
    '- Seçenekler kısa, net ve birbirinden farklı olsun.',
    `- Zorluk seviyesi: ${difficulty}.`,
    '- Soruları ve seçenekleri Türkçe yaz.',
    '- Yalnızca sağlanan JSON şemasına uygun çıktı döndür.',
  ].join('\n');
}

/**
 * Reads a Web File object as base64.
 */
function readBase64Web(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('PDF dosyası okunamadı.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Main function to generate questions from PDF/topic.
 */
export async function generateQuestionsFromSource(
  params: GenerateAiQuestionsParams
): Promise<{ questions: QuestionDraft[] }> {
  const {
    topic = '',
    pdfUri,
    pdfFile,
    count,
    difficulty,
    defaultTimeLimitSeconds,
    defaultPoints,
  } = params;

  const hasPdf = !!pdfUri || !!pdfFile;

  if (!hasPdf && !topic.trim()) {
    throw new Error('Soru üretmek için bir PDF yükle ya da bir konu yaz.');
  }

  const normalizedCount = Math.round(clamp(count, 1, 20));
  const defaults = {
    time_limit_seconds: Math.round(clamp(defaultTimeLimitSeconds, MIN_TIME_LIMIT, MAX_TIME_LIMIT)),
    points: Math.round(clamp(defaultPoints, MIN_POINTS, MAX_POINTS)),
  };

  let pdfBase64: string | undefined;

  if (hasPdf) {
    try {
      if (Platform.OS === 'web') {
        if (pdfFile) {
          pdfBase64 = await readBase64Web(pdfFile);
        } else if (pdfUri) {
          // If we have uri on web, fetch it and convert to Blob
          const res = await fetch(pdfUri);
          const blob = await res.blob();
          pdfBase64 = await readBase64Web(blob as File);
        }
      } else if (pdfUri) {
        // Read file using expo-file-system
        pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: 'base64',
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'bilinmeyen hata';
      throw new Error(`PDF dosyası okunurken hata oluştu: ${msg}`);
    }
  }

  const prompt = buildPrompt({
    count: normalizedCount,
    difficulty,
    topic: topic.trim(),
    hasPdf: !!pdfBase64,
  });

  const rawJson = await generateContent({ prompt, pdfBase64 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('AI yanıtı işlenemedi (geçersiz JSON formatı).');
  }

  const rawQuestions =
    isRecord(parsed) && Array.isArray(parsed.questions) ? parsed.questions : [];

  const questions = rawQuestions
    .map((item) => normalizeGeneratedQuestion(item, defaults))
    .filter((question): question is QuestionDraft => question !== null);

  if (questions.length === 0) {
    throw new Error('AI uygun soru üretemedi, farklı bir kaynak ya da konu dene.');
  }

  return { questions };
}
