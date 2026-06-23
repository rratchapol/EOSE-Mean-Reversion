const baseUrl = process.env.SCANNER_BASE_URL ?? "http://localhost:3000";
const ticker = process.argv[2] ?? "EOSE";
const range = process.argv[3] ?? "60d";

const response = await fetch(`${baseUrl}/api/backtest?ticker=${ticker}&range=${range}`);
const text = await response.text();
let body;

try {
  body = text ? JSON.parse(text) : {};
} catch {
  console.error("Backtest failed: server returned a non-JSON response.");
  console.error(text.slice(0, 500));
  process.exit(1);
}

if (!response.ok) {
  console.error(body.error ?? body);
  process.exit(1);
}

console.log(JSON.stringify(body.summary, null, 2));
console.log("");
console.log("Recent trades:");
console.table(
  body.trades.slice(-10).map((trade) => ({
    entryTime: trade.entryTime,
    result: trade.result,
    entry: trade.entry.toFixed(2),
    target: trade.target.toFixed(2),
    stopLoss: trade.stopLoss.toFixed(2),
    returnPercent: trade.returnPercent.toFixed(2),
    rr: trade.rr.toFixed(2),
  })),
);
