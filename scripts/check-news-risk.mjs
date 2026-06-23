const baseUrl = process.env.SCANNER_BASE_URL ?? "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/scan`);
const body = await response.json();

if (!response.ok) {
  console.error(body);
  process.exit(1);
}

const news = body.checklist.find((item) => item.label === "News risk filter");

console.log(
  JSON.stringify(
    {
      ticker: body.ticker,
      status: body.status,
      newsPassed: news?.passed,
      newsDetail: news?.detail,
      lastScan: body.lastScan,
    },
    null,
    2,
  ),
);
