import type { Metadata } from "next";
import { Geist, Geist_Mono, Jersey_10 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const jersey = Jersey_10({
  variable: "--font-jersey",
  weight: ["400"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "CondorCoders Café Virtual",
  description: "Virtual café experience with real-time chat and gaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jersey.variable} font-sans bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
