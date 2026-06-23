const baseUrl = process.env.SCANNER_BASE_URL ?? "http://localhost:3000";

const response = await fetch(`${baseUrl}/api/worker/scan`, {
  method: "POST",
});

const body = await response.json();

if (!response.ok) {
  console.error(body);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: body.scan.status,
      price: body.scan.price,
      alert: body.alert,
      storedId: body.stored.id,
    },
    null,
    2,
  ),
);
