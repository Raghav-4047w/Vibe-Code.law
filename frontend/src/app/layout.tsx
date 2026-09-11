import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Evidence Locker",
  description: "National Judicial & Forensic Authentication Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface">
        {children}
      </body>
    </html>
  );
}
