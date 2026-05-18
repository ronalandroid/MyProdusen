import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "@/lib/init";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
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
    <html lang="id">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  );
}
