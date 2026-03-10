import Link from "next/link";

import { SITE_CONFIG } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { UserNav } from "@/components/layout/user-nav";
import { CommandPalette } from "@/components/common/command-palette";

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-2">
                <MobileNav />
                <Link href="/" className="shrink-0 text-sm font-bold">
                    {SITE_CONFIG.name}
                </Link>
                <div className="hidden md:flex ml-4">
                    <DesktopNav />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <CommandPalette />
                    <ThemeToggle />
                    <UserNav />
                </div>
            </div>
        </header>
    );
}
