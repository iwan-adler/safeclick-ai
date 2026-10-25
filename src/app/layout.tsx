import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyzerProvider } from "@/components/analyze/AnalyzerProvider";
import { MobileNav, Sidebar } from "@/components/shell/Navigation";
import { ServiceWorkerRegister } from "@/components/shell/ServiceWorkerRegister";
import "./globals.css";

// next/font downloads these at build time and serves them from this app,
// so no request is made to Google when someone uses SafeClick.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "SafeClick AI: Pause. Understand. Stay Safe.", template: "%s · SafeClick AI" },
  description:
    "A privacy-first scam-awareness companion. Check suspicious messages locally, understand the warning signs, and practise safer choices.",
  applicationName: "SafeClick AI",
};

export const viewport: Viewport = {
  themeColor: "#0a1029",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: theme-init.js may set data-theme on <html> before hydration.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to content
        </a>
        <AnalyzerProvider>
          <Sidebar />
          <MobileNav />
          <main id="main" className="lg:pl-64">
            <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">{children}</div>
          </main>
        </AnalyzerProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
