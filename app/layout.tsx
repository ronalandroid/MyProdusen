import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyProdusen - Aplikasi HRIS Mobile",
  description: "Aplikasi HRIS mobile untuk memudahkan pengelolaan karyawan, kehadiran, cuti, penggajian untuk Produsen Dimsum Medan.",
  keywords: ["hris", "mobile app", "employee management", "attendance", "dimsum medan"],
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
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body style={{ backgroundColor: "#EAEAEA", display: "flex", justifyContent: "center" }}>
        <div className="mobile-container" style={{ width: "100%", backgroundColor: "#F5F5F5" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
