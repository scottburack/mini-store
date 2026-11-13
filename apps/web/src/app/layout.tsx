import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { UserNav } from "@/app/ui/user-nav";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mini Store",
  description: "A small Next.js + NestJS store",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
            <Link href="/" className="font-semibold">
              Mini Store
            </Link>
            <Suspense fallback={<span className="text-sm text-zinc-400">…</span>}>
              <UserNav />
            </Suspense>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
