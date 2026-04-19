import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Moire — Faceted Knowledge Graph Navigation",
  description: "Text-primary faceted parallax navigation for SPARQL endpoints",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
