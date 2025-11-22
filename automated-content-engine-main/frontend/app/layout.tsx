import type { Metadata } from "next";
import "../styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Inter } from "next/font/google";
import { Providers } from "../src/app/providers";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Automated Content Engine",
  description: "AI-powered content engine for X threads and hook polishing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* We'll use client-side only dark mode to avoid hydration issues */}
      </head>
      <body
        className={`${inter.variable} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
