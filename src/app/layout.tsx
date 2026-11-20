import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AUREA — Премиальный фитнес-клуб",
  description: "Bespoke architectural fitness spaces. Premium clubs in Krasnodar for strength, recovery and aesthetic precision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable}`}>
      <body className="font-sans bg-[#fff9f5] text-[#3b322d]">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}