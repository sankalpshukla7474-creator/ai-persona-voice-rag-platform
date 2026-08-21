import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sankalp Shukla AI Representative",
  description: "Grounded AI representative with voice, RAG, and controlled scheduling tools."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
