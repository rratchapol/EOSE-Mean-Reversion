export type NewsRisk = {
  clean: boolean;
  note: string;
};

type SecFiling = {
  form: string;
  filingDate: string;
  description: string;
};

type NewsItem = {
  title: string;
  publishedAt: string;
};

const riskKeywords = [
  "offering",
  "dilution",
  "dilutive",
  "share issuance",
  "registered direct",
  "private placement",
  "prospectus",
  "at-the-market",
  "atm program",
  "warrant",
  "convertible",
  "reverse split",
  "bankruptcy",
  "going concern",
];

const riskForms = ["S-1", "S-3", "S-3ASR", "424B", "424B3", "424B5", "FWP", "POS AM"];

function lookbackDays(): number {
  const value = Number(process.env.NEWS_RISK_LOOKBACK_DAYS ?? 14);
  return Number.isFinite(value) && value > 0 ? value : 14;
}

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT || "EOSE Scanner contact@example.com";
}

function isRecent(dateText: string, days: number): boolean {
  const timestamp = Date.parse(dateText);
  if (!Number.isFinite(timestamp)) return false;
  return timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function hasRiskKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return riskKeywords.some((keyword) => lower.includes(keyword));
}

async function getCik(ticker: string): Promise<string> {
  const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": secUserAgent() },
    next: { revalidate: 24 * 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`SEC ticker request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { ticker: string; cik_str: number }>;
  const match = Object.values(data).find((item) => item.ticker.toUpperCase() === ticker);
  if (!match) {
    throw new Error(`SEC CIK not found for ${ticker}.`);
  }

  return String(match.cik_str).padStart(10, "0");
}

async function getRecentSecFilings(ticker: string): Promise<SecFiling[]> {
  const cik = await getCik(ticker);
  const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: { "User-Agent": secUserAgent() },
    next: { revalidate: 15 * 60 },
  });

  if (!response.ok) {
    throw new Error(`SEC submissions request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    filings?: {
      recent?: {
        form?: string[];
        filingDate?: string[];
        primaryDocDescription?: string[];
      };
    };
  };

  const recent = data.filings?.recent;
  return (recent?.form ?? []).slice(0, 40).map((form, index) => ({
    form,
    filingDate: recent?.filingDate?.[index] ?? "",
    description: recent?.primaryDocDescription?.[index] ?? "",
  }));
}

function parseYahooRss(xml: string): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20).map((match) => {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    return {
      title: (title?.[1] ?? title?.[2] ?? "").replaceAll("&amp;", "&").trim(),
      publishedAt: pubDate?.[1] ?? "",
    };
  });
}

async function getRecentYahooNews(ticker: string): Promise<NewsItem[]> {
  const url = new URL("https://feeds.finance.yahoo.com/rss/2.0/headline");
  url.searchParams.set("s", ticker);
  url.searchParams.set("region", "US");
  url.searchParams.set("lang", "en-US");

  const response = await fetch(url, { next: { revalidate: 15 * 60 } });
  if (!response.ok) {
    throw new Error(`Yahoo news request failed: ${response.status}`);
  }

  return parseYahooRss(await response.text());
}

async function getAutoNewsRisk(ticker: string): Promise<NewsRisk> {
  const days = lookbackDays();
  const [filingsResult, newsResult] = await Promise.allSettled([
    getRecentSecFilings(ticker),
    getRecentYahooNews(ticker),
  ]);

  const filings = filingsResult.status === "fulfilled" ? filingsResult.value : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value : [];
  const riskyFiling = filings.find(
    (filing) =>
      isRecent(filing.filingDate, days) &&
      (riskForms.some((form) => filing.form.startsWith(form)) ||
        hasRiskKeyword(`${filing.form} ${filing.description}`)),
  );
  const riskyNews = news.find(
    (item) => isRecent(item.publishedAt, days) && hasRiskKeyword(item.title),
  );

  if (riskyFiling) {
    return {
      clean: false,
      note: `SEC ${riskyFiling.form} ${riskyFiling.filingDate}: ${riskyFiling.description || "risk filing detected"}`,
    };
  }

  if (riskyNews) {
    return {
      clean: false,
      note: `ข่าวเสี่ยง: ${riskyNews.title}`,
    };
  }

  const sourceIssues = [
    filingsResult.status === "rejected" ? `SEC error: ${filingsResult.reason}` : "",
    newsResult.status === "rejected" ? `News error: ${newsResult.reason}` : "",
  ].filter(Boolean);

  return {
    clean: true,
    note:
      sourceIssues.length > 0
        ? `ไม่พบข่าวเสี่ยง แต่มีบางแหล่งดึงไม่ได้: ${sourceIssues.join(" / ")}`
        : `ไม่พบ filing/news เสี่ยงใน ${days} วันล่าสุด`,
  };
}

export async function getNewsRisk(ticker = "EOSE"): Promise<NewsRisk> {
  const mode = process.env.NEWS_RISK_MODE ?? "manual";
  const manualFlagged = process.env.NEWS_RISK_FLAG === "true";
  const manualNote = process.env.NEWS_RISK_NOTE?.trim();

  if (manualFlagged) {
    return {
      clean: false,
      note: manualNote || "Manual news risk flag is active.",
    };
  }

  if (mode === "auto") {
    return getAutoNewsRisk(ticker);
  }

  return {
    clean: true,
    note: manualNote || "Manual news risk flag is clean.",
  };
}
