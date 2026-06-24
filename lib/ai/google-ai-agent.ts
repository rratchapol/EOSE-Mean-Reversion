import type { DailyRangeResult } from "@/lib/daily-range/daily-range-agent";

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
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
    "ตอบเป็นภาษาไทยเท่านั้น และตอบสั้นมาก ไม่เกิน 5 บรรทัด",
    "รูปแบบที่ต้องการ:",
    "1) มุมมอง: ...",
    "2) กรอบวันนี้: ...",
    "3) จุดเสี่ยง/ข่าว: ...",
    "4) เงื่อนไขที่ต้องรอก่อนเข้า: ...",
    "5) Invalidate: ...",
    "ห้ามบอกว่าเป็นคำแนะนำการลงทุน ห้ามฟันธง high/low แน่นอน",
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
        temperature: 0.1,
        maxOutputTokens: 900,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return `AI วิเคราะห์ไม่ได้: ${await response.text()}`;
  }

  const body = (await response.json()) as GeminiResponse;
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();

  if (!text) return "AI วิเคราะห์ไม่ได้: ไม่พบข้อความตอบกลับ";
  if (candidate?.finishReason === "MAX_TOKENS") {
    return `${text}\n(หมายเหตุ: AI ตอบยาวเกินและถูกตัด)`;
  }

  return text;
}
