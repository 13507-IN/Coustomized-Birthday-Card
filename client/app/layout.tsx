import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
