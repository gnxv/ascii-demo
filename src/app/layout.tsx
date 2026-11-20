import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const spline = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spline",
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
    <html lang="ru" className={`${GeistSans.variable} ${spline.variable}`}>
      <body className="font-sans bg-[#fff9f5] text-[#3b322d]">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
