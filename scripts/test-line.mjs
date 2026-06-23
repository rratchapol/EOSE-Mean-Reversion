const baseUrl = process.env.SCANNER_BASE_URL ?? "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/line/test`, {
  method: "POST",
});
const body = await response.json();

if (!response.ok || !body.sent) {
  console.error(body);
  process.exit(1);
}

console.log("LINE test message sent.");
