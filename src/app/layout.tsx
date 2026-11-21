import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ASCII Demo — Code-drawn animations",
  description: "Six canvas scenes: jellyfish, snow, melting text, glitch silhouette, physics, reactive grid.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="font-sans bg-black text-white">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
