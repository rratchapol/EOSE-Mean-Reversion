import type { DailyRangeResult } from "@/lib/daily-range/daily-range-agent";

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiAttempt = {
  model: string;
  text?: string;
  error?: string;
};

export function hasGoogleAiConfig(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function modelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const fallbacks = (
    process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-3.1-flash-lite,gemini-3.5-flash,gemini-3-flash,gemini-2.5-flash"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fallbacks])];
}

function buildPrompt(range: DailyRangeResult): string {
  return [
    "You are a risk-focused stock analysis assistant for retail traders.",
    "Answer in Thai only.",
    "Keep the answer complete and concise: exactly 5 short lines.",
    "Use this fixed format:",
    "1) มุมมอง: ...",
    "2) กรอบวันนี้: ...",
    "3) จุดเสี่ยง/ข่าว: ...",
    "4) เงื่อนไขที่ต้องรอก่อนเข้า: ...",
    "5) Invalidate: ...",
    "Do not claim certainty. Do not say this is investment advice.",
    "",
    JSON.stringify(
      {
        ticker: range.ticker,
        price: range.price,
        bias: range.bias,
        confidence: range.confidence,
        atr14: range.atr14,
        conservative: range.conservative,
        expected: range.expected,
        extreme: range.extreme,
        support: range.support,
        resistance: range.resistance,
        reasons: range.reasons,
        newsNote: range.newsNote,
      },
      null,
      2,
    ),
  ].join("\n");
}

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<GeminiAttempt> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      model,
      error: `${response.status}: ${await response.text()}`,
    };
  }

  const body = (await response.json()) as GeminiResponse;
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();

  if (!text) {
    return { model, error: "empty response" };
  }

  if (candidate?.finishReason === "MAX_TOKENS") {
    return { model, error: `MAX_TOKENS: ${text}` };
  }

  return { model, text };
}

export async function analyzeDailyRangeWithGoogleAi(
  range: DailyRangeResult,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildPrompt(range);
  const attempts: GeminiAttempt[] = [];

  for (const model of modelCandidates()) {
    const attempt = await callGemini(model, apiKey, prompt);
    attempts.push(attempt);
    if (attempt.text) return attempt.text;
  }

  const last = attempts.at(-1);
  return [
    "AI วิเคราะห์ไม่ได้ชั่วคราว",
    last ? `model ล่าสุด: ${last.model}` : "ไม่พบ model ที่ลองเรียก",
    last?.error ? `สาเหตุ: ${last.error.slice(0, 220)}` : "",
    "ระบบยังส่งกรอบราคา/ข่าว/แนวรับแนวต้านได้ตามปกติ",
  ]
    .filter(Boolean)
    .join("\n");
}
