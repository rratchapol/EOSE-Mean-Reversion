import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EOSE Mean Reversion Scanner",
  description: "Rule-based Stochastic + FVG scanner with LINE alerts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
