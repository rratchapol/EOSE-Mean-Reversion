"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function ScanNowButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function scanNow() {
    setState("loading");

    try {
      const response = await fetch("/api/worker/scan", { method: "POST" });
      if (!response.ok) throw new Error("Scan request failed");
      setState("done");
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setState("error");
    }
  }

  return (
    <button className="scan-button" disabled={state === "loading"} onClick={scanNow} type="button">
      <RefreshCw size={16} />
      {state === "loading"
        ? "กำลังสแกน..."
        : state === "done"
          ? "สแกนแล้ว"
          : state === "error"
            ? "สแกนไม่สำเร็จ"
            : "สแกนตอนนี้"}
    </button>
  );
}
