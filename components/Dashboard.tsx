import { Activity, Bell, CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import ScanNowButton from "@/components/ScanNowButton";
import type { ScannerResult, StoredSignal } from "@/lib/types";

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const statusText = {
  WAIT: "รอ",
  WATCH: "เฝ้าดู",
  SETUP: "เข้าเงื่อนไข",
  AVOID: "หลีกเลี่ยง",
};

const checklistText: Record<string, string> = {
  "1H Stochastic oversold": "Stochastic 1H อยู่โซน Oversold",
  "Price inside or near bullish FVG": "ราคาอยู่ใน/ใกล้ FVG ฝั่งรับ",
  "15M bullish trigger": "มีสัญญาณกลับตัวบน 15M",
  "Volume confirmation": "Volume ยืนยัน",
  "RR at least 1:2": "RR อย่างน้อย 1:2",
  "News risk filter": "ตัวกรองข่าวเสี่ยง",
};

function translateChecklist(label: string): string {
  return checklistText[label] ?? label;
}

function translateAlert(text: string): string {
  if (text.startsWith("Current status is")) return "ยังไม่ส่ง เพราะยังไม่เข้าเงื่อนไข";
  if (text.includes("Duplicate SETUP")) return "กันแจ้งเตือนซ้ำ";
  if (text.includes("missing")) return "ยังไม่ได้ตั้งค่า LINE";
  return text;
}

function translateReason(reason: string): string {
  const [label, ...detail] = reason.split(": ");
  const translated = translateChecklist(label);
  return detail.length > 0 ? `${translated}: ${detail.join(": ")}` : translated;
}

export default function Dashboard({
  history,
  scan,
}: {
  history: StoredSignal[];
  scan: ScannerResult;
}) {
  const visibleCandles = scan.candles15m.slice(-72);
  const maxHigh = Math.max(...visibleCandles.map((candle) => candle.high));
  const minLow = Math.min(...visibleCandles.map((candle) => candle.low));
  const priceRange = Math.max(maxHigh - minLow, 0.01);

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <h1 className="title">EOSE Scanner สูตรเด้งกลับ</h1>
            <div className="subtle">
              Stochastic + FVG + Volume / แหล่งข้อมูล: {scan.marketDataMode}
            </div>
          </div>
          <div className="top-actions">
            <ScanNowButton />
            <div className={`status-pill ${scan.status}`}>{statusText[scan.status]}</div>
          </div>
        </header>

        <section className="status-card">
          <div className="metric">
            <span>ราคาล่าสุด</span>
            <strong>{money(scan.price)}</strong>
          </div>
          <div className="metric">
            <span>สถานะสัญญาณ</span>
            <strong className={`status ${scan.status}`}>{scan.status}</strong>
            <div className="subtle">{statusText[scan.status]}</div>
          </div>
          <div className="metric">
            <span>Risk / Reward</span>
            <strong>1:{scan.tradePlan.rr.toFixed(2)}</strong>
          </div>
          <div className="metric">
            <span>สแกนล่าสุด</span>
            <strong>{new Date(scan.lastScan).toLocaleTimeString()}</strong>
          </div>
        </section>

        <div className="grid" style={{ marginTop: 18 }}>
          <section className="panel">
            <h2>กราฟราคา 15 นาที</h2>
            <div className="chart" aria-label="15 minute candle chart">
              <div className="candles">
                {visibleCandles.map((candle) => {
                  const height = ((candle.high - minLow) / priceRange) * 86 + 8;
                  return (
                    <div
                      className={`candle ${candle.close < candle.open ? "down" : ""}`}
                      key={candle.time}
                      title={`${money(candle.close)} / volume ${candle.volume}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="stack">
            <section className="panel">
              <h2>Checklist ก่อนเข้า</h2>
              <ul className="checklist">
                {scan.checklist.map((item) => (
                  <li className={`check ${item.passed ? "passed" : "failed"}`} key={item.label}>
                    {item.passed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    <div>
                      <strong>{translateChecklist(item.label)}</strong>
                      <div className="subtle">{item.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>แผนเทรด</h2>
              <div className="trade-grid">
                <div className="metric">
                  <span>จุดเข้า</span>
                  <strong>{money(scan.tradePlan.entry)}</strong>
                </div>
                <div className="metric">
                  <span>Stop Loss</span>
                  <strong>{money(scan.tradePlan.stopLoss)}</strong>
                </div>
                <div className="metric">
                  <span>TP1</span>
                  <strong>{money(scan.tradePlan.tp1)}</strong>
                  <div className="subtle">+{percent(scan.tradePlan.tp1Percent)}</div>
                </div>
                <div className="metric">
                  <span>TP2</span>
                  <strong>{money(scan.tradePlan.tp2)}</strong>
                  <div className="subtle">+{percent(scan.tradePlan.tp2Percent)}</div>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div className="grid" style={{ marginTop: 18 }}>
          <section className="panel">
            <h2>
              <Activity size={16} /> เหตุผลที่ผ่านตอนนี้
            </h2>
            <ul className="reasons">
              {scan.reasons.map((reason) => (
                <li key={reason}>{translateReason(reason)}</li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>
              <ShieldAlert size={16} /> ความเสี่ยง + แจ้งเตือน
            </h2>
            <p className="subtle">
              ตัวกรองข่าว/SEC ทำงานแบบ auto ทุกครั้งที่สแกน และยังใช้
              <code> NEWS_RISK_FLAG=true</code> เป็น kill switch ได้เมื่อรู้ข่าวเสี่ยงก่อนระบบ
            </p>
            <p className="subtle">
              <Bell size={14} /> LINE จะส่งเฉพาะตอนสถานะเป็น <strong>เข้าเงื่อนไข</strong>.
            </p>
          </section>
        </div>

        <section className="panel" style={{ marginTop: 18 }}>
          <h2>ประวัติการสแกนล่าสุด</h2>
          <div className="table">
            <div className="table-row table-head">
              <span>เวลา</span>
              <span>สถานะ</span>
              <span>ราคา</span>
              <span>RR</span>
              <span>แจ้งเตือน</span>
            </div>
            {history.length === 0 ? (
              <div className="empty">ยังไม่มีประวัติ กดรัน /api/worker/scan หรือ npm run scan</div>
            ) : (
              history.map((item) => (
                <div className="table-row" key={item.id}>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span className={`status ${item.status}`}>{statusText[item.status]}</span>
                  <span>{money(item.price)}</span>
                  <span>1:{item.rr.toFixed(2)}</span>
                  <span>{item.alertSent ? "ส่งแล้ว" : translateAlert(item.alertReason ?? "ยังไม่ส่ง")}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
