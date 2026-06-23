export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SignalStatus = "WAIT" | "WATCH" | "SETUP" | "AVOID";

export type ChecklistItem = {
  label: string;
  passed: boolean;
  detail: string;
};

export type FvgZone = {
  lower: number;
  upper: number;
  createdAt: string;
  status: "open" | "touched" | "filled";
};

export type TradePlan = {
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  riskPercent: number;
  tp1Percent: number;
  tp2Percent: number;
  rr: number;
};

export type ScannerResult = {
  ticker: string;
  status: SignalStatus;
  price: number;
  lastScan: string;
  marketDataMode: "demo" | "twelve-data" | "yahoo";
  checklist: ChecklistItem[];
  tradePlan: TradePlan;
  fvgZones: FvgZone[];
  reasons: string[];
  candles15m: Candle[];
  candles1h: Candle[];
};

export type StoredSignal = {
  id: string;
  ticker: string;
  status: SignalStatus;
  price: number;
  rr: number;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  reasons: string[];
  createdAt: string;
  alertSent: boolean;
  alertReason?: string;
};
