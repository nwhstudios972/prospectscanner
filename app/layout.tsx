import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const uiSans = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
});

const uiMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProspectScanner",
  description:
    "Détection automatisée d'établissements professionnels sans site web à partir de leur présence sur les réseaux sociaux.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${uiSans.variable} ${uiMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
