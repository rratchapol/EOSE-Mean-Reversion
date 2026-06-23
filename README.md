# EOSE Mean Reversion Scanner

Rule-based scanner for the EOSE Stochastic + FVG mean reversion setup.

## MVP Features

- Next.js dashboard for EOSE
- Demo 1H and 15M candle data
- Stochastic 14,3,3
- Bullish FVG detection
- 15M trigger candle checks
- Volume confirmation
- Entry, stop loss, TP1, TP2, and RR
- LINE Messaging API alert endpoint
- File-based scan history and duplicate alert suppression

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Real Candle Data

Yahoo Finance chart data is the default live provider:

```bash
MARKET_DATA_MODE=yahoo
```

To use Twelve Data candles instead, set:

```bash
MARKET_DATA_MODE=twelve-data
TWELVE_DATA_API_KEY=your_api_key
```

The app requests `15m` and `1h` candles for EOSE.

## LINE Alert Setup

Copy `.env.example` to `.env.local` and fill:

```bash
LINE_CHANNEL_ACCESS_TOKEN=
LINE_USER_ID=
```

To capture `LINE_USER_ID`, expose `/api/line/webhook` publicly with a tunnel such as ngrok, add that URL in LINE Developers webhook settings, then add the bot and send it a message. Captured users are saved to `data/line-users.json`.

After a user is captured:

```bash
npm run line:set-user
```

Then call:

```bash
curl -X POST http://localhost:3000/api/alerts/line
```

The endpoint only sends when scanner status is `SETUP`.

## Scan Worker

With the dev server running, record a scan and send LINE only when needed:

```bash
npm run scan
```

For Task Scheduler or cron, run this command every 5-15 minutes while the app is hosted/running.
Saved scan history is stored in `data/scanner-history.json`.

## Scan Schedule

The dashboard has a `สแกนตอนนี้` button for manual scans.

Install Windows Task Scheduler jobs:

```bash
npm run schedule:install
```

This creates:

- `EOSE Scanner - Market Hours 15m`: runs every 15 minutes from 6:30 AM to 1:00 PM Pacific, Monday-Friday.
- `EOSE Scanner - Off Hours Noon`: runs at 12:00 PM daily, but skips when market is open.

Remove the scheduled tasks:

```bash
npm run schedule:uninstall
```

Important: keep the app running at `http://localhost:3000` with `npm run dev` or a production server, because the worker posts to `/api/worker/scan`.

## News / Dilution Filter

Auto mode checks recent SEC filings and Yahoo Finance RSS headlines for dilution/offering risk:

```bash
NEWS_RISK_MODE=auto
NEWS_RISK_LOOKBACK_DAYS=14
SEC_USER_AGENT=EOSE Scanner your-email@example.com
```

Use the manual kill switch when EOSE has dilution/offering/news risk and you want the scanner to force `AVOID`:

```bash
NEWS_RISK_FLAG=true
NEWS_RISK_NOTE=Offering or dilution risk detected
```

Run a manual news/SEC check:

```bash
npm run news:check
```

Scheduled scans also run the same news/SEC filter, so the noon scan acts as the daily news check.

## Backtest

Run a simple 15M/1H rule backtest:

```bash
npm run backtest
```

Optional arguments:

```bash
npm run backtest -- EOSE 60d
```

The MVP backtest ignores point-in-time news availability and only tests the technical setup.
