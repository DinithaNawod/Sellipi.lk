import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are an expert epigraphist and linguist specializing in ancient Sri Lankan inscriptions.
Your task is to translate ancient Sinhala and Brahmi script text into modern Sinhala and English.

Rules:
- Provide BOTH a modern Sinhala translation and an English translation
- Preserve historical meaning and context; do not modernize the tone
- If a word is unclear or damaged, note it with [unclear]
- Include a brief historical context note after the translations
- Format your response as:
  SINHALA: <modern Sinhala translation>
  ENGLISH: <English translation>
  CONTEXT: <1-2 sentences of historical context>`;

export async function translateText(ancientText, scriptType = '') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // 'gemini-flash-latest' is an alias that tracks Google's current flash model,
  // so this won't break when a specific version is retired.
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const scriptContext = scriptType ? ` written in ${scriptType} script` : '';
  const prompt = `${SYSTEM_PROMPT}

Translate the following ancient Sri Lankan inscription text${scriptContext}:

"${ancientText}"`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Parse structured response
  const sinhalaPart = responseText.match(/SINHALA:\s*(.+?)(?=ENGLISH:|$)/s)?.[1]?.trim() ?? '';
  const englishPart = responseText.match(/ENGLISH:\s*(.+?)(?=CONTEXT:|$)/s)?.[1]?.trim() ?? '';
  const contextPart = responseText.match(/CONTEXT:\s*(.+?)$/s)?.[1]?.trim() ?? '';

  // Build combined translation
  const combined = [
    sinhalaPart && `[සිංහල] ${sinhalaPart}`,
    englishPart && `[English] ${englishPart}`,
    contextPart && `[Historical Context] ${contextPart}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return combined || responseText;
}
