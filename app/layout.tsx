import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audena Call Simulator",
  description: "Calls + provider simulation + webhook-driven status updates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
