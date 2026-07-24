import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadDesk Mini",
  description: "A tiny lead-capture tool built for the Digital Heroes Full Stack Development task.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
