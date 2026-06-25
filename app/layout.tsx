import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import Providers from "./providers";
import "@/lib/init";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-mono",
  display: "swap",
  // Numbers-only font (stat figures on dashboards); never above-the-fold on the
  // landing/auth pages. Skip preloading so its 3 weight files don't compete with
  // the critical render path — it loads on demand when a stat view mounts.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://myprodusen.online"),
  title: "MyProdusen — Sistem Internal Produsen Dimsum Medan",
  description: "MyProdusen adalah sistem internal Produsen Dimsum Medan by TBM Group untuk absensi, cuti, payroll, KPI produksi, dan koordinasi tim.",
  keywords: ["hris", "mobile app", "employee management", "attendance", "dimsum medan", "hr system"],
  authors: [{ name: "MyProdusen Team" }],
  creator: "MyProdusen",
  publisher: "MyProdusen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  applicationName: "MyProdusen",
  appleWebApp: {
    capable: true,
    title: "MyProdusen",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "MyProdusen — Sistem Internal Produsen Dimsum Medan",
    description: "MyProdusen adalah sistem internal Produsen Dimsum Medan by TBM Group untuk absensi, cuti, payroll, KPI produksi, dan koordinasi tim.",
    type: "website",
    locale: "id_ID",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#FFC107",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <div className="mobile-container">
            {children}
          </div>
          <PwaInstallPrompt />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
