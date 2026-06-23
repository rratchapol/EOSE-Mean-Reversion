import Dashboard from "@/components/Dashboard";
import { getSignalHistory } from "@/lib/db/history-store";
import { runScanner } from "@/lib/signals/signal-engine";

export default async function Home() {
  const [scan, history] = await Promise.all([runScanner("EOSE"), getSignalHistory(8)]);

  return <Dashboard history={history} scan={scan} />;
}
