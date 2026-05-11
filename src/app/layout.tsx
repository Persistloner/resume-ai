import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Link from "next/link"
import { FileText } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "简历生成器",
  description: "简洁易用的简历编辑器，实时预览、AI 辅助优化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="h-14 border-b flex items-center px-6 shrink-0 bg-background">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm hover:text-primary transition-colors">
            <FileText className="size-4" />
            简历生成器
          </Link>
        </header>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
