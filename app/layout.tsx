import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SITE_CONFIG } from "@/config/site";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider>
                    <div className="relative flex min-h-svh flex-col">
                        <SiteHeader />
                        <main className="flex-1">{children}</main>
                        <SiteFooter />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
