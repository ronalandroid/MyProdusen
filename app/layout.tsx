import type { Metadata, Viewport } from "next";
import "@/lib/init";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "MyProdusen - Aplikasi HRIS Mobile",
  description: "Aplikasi HRIS mobile untuk memudahkan pengelolaan karyawan, kehadiran, cuti, penggajian untuk Produsen Dimsum Medan.",
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
    title: "MyProdusen - Aplikasi HRIS Mobile",
    description: "Sistem HRIS lengkap untuk manajemen karyawan, absensi, dan operasional",
    type: "website",
    locale: "id_ID",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ToastProvider>
          <div className="mobile-container">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
