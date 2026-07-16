import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Ratio Coffee — POS",
  description:
    "A point-of-sale demo for a coffee bar — register, payment, and a live sales dashboard against a real API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} ${shippori.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
