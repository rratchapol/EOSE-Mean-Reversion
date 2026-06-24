import type { DailyRangeResult } from "@/lib/daily-range/daily-range-agent";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export function hasGoogleAiConfig(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function analyzeDailyRangeWithGoogleAi(
  range: DailyRangeResult,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const prompt = [
    "คุณคือผู้ช่วยวิเคราะห์หุ้นเชิงความเสี่ยงสำหรับ trader รายย่อย",
    "ให้วิเคราะห์ EOSE เป็นภาษาไทย กระชับ ไม่เกิน 8 บรรทัด",
    "ห้ามบอกว่าเป็นคำแนะนำการลงทุน ห้ามฟันธง high/low แน่นอน",
    "ให้สรุป bias, กรอบราคา, จุด invalidate, และสิ่งที่ต้องรอก่อนเข้า",
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

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return `AI วิเคราะห์ไม่ได้: ${await response.text()}`;
  }

  const body = (await response.json()) as GeminiResponse;
  const text = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();

  return text || "AI วิเคราะห์ไม่ได้: ไม่พบข้อความตอบกลับ";
}
