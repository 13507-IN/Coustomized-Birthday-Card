import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import "./globals.css";

const brandFont = Unbounded({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Birthday Card Studio",
  description: "Create a customized birthday card with photos and a message.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${brandFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
