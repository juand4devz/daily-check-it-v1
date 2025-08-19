import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GeneralLayout from "@/components/layout/general-layout";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DailyCek.It - Diagnosa Kerusakan Laptop & PC Berbasis AI",
  description:
    "DailyCek.It adalah platform cerdas untuk mendiagnosa kerusakan laptop dan PC secara cepat, akurat, dan berbasis AI. Temukan solusi instan, panduan teknis, dan tips perawatan perangkat.",
  keywords: [
    "diagnosa laptop",
    "diagnosa PC",
    "kerusakan laptop",
    "AI diagnosa laptop",
    "perbaikan laptop",
    "teknisi komputer online",
    "DailyCek.It",
    "diagnosa kerusakan perangkat",
    "panduan teknis komputer",
    "tips perawatan laptop",
  ],
  authors: [{ name: "JuandaDevz" }],
  creator: "JuandaDevz",
  publisher: "JuandaDevz",
  metadataBase: new URL("https://daily-cekit.vercel.app"),
  alternates: {
    canonical: "https://daily-cekit.vercel.app",
    languages: {
      "id-ID": "https://daily-cekit.vercel.app",
      "en-US": "https://daily-cekit.vercel.app/en",
    },
  },
  openGraph: {
    title: "DailyCek.It - Diagnosa Laptop & PC Berbasis AI",
    description:
      "Diagnosa kerusakan laptop dan PC secara cepat, terukur, dan berbasis AI. Solusi instan, panduan teknis, dan tips perawatan perangkat hanya di DailyCek.It.",
    url: "https://daily-cekit.vercel.app",
    siteName: "DailyCek.It",
    images: [
      {
        url: "/logos/daily-cek-it-logo.svg",
        width: 1200,
        height: 630,
        alt: "DailyCek.It - Diagnosa Laptop & PC Berbasis AI",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyCek.It - Diagnosa Laptop & PC Berbasis AI",
    description:
      "Platform cerdas untuk diagnosa kerusakan laptop & PC berbasis AI. Temukan solusi instan, panduan teknis, dan tips perawatan perangkat.",
    images: ["/logos/DailyCekItLogo.png"],
    creator: "@dailycekit",
  },
  icons: {
    icon: [
      { url: "/logos/DailyCekItLogo.png", type: "image/png", sizes: "32x32" },
      { url: "/logos/DailyCekItLogo.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      {
        url: "/logos/DailyCekItLogo.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
    shortcut: ["/logos/DailyCekItLogo.png"],
  },
  verification: {
    google: "ZbSwvrHd1CKa2aspwE9ljfVWUAECQllgkyAsvMIx_Us",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GeneralLayout>
          {children}
          <Toaster position="top-center" />
        </GeneralLayout>
      </body>
    </html>
  );
}
