import DashboardLayout from "@/components/DashboardLayout/DashboardLayout";
import { AgentModeProvider } from "@/contexts/AgentModeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import clsx from "clsx";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Automated Content Engine",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={clsx(
          inter.className,
          "antialiased",
          "min-h-screen",
          "text-white"
        )}
      >
        <AuthProvider>
          <AgentModeProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </AgentModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
