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

const description =
  "Détection automatisée d'établissements professionnels sans site web à partir de leur présence sur les réseaux sociaux.";

export const metadata: Metadata = {
  metadataBase: new URL("https://prospectscan.cyou"),
  title: "ProspectScanner",
  description,
  openGraph: {
    title: "ProspectScanner",
    description,
    url: "https://prospectscan.cyou",
    siteName: "ProspectScanner",
    images: [{ url: "/og-image.jpg", width: 1254, height: 1254 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProspectScanner",
    description,
    images: ["/og-image.jpg"],
  },
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
