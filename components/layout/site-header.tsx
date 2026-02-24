import Link from "next/link";

import { SITE_CONFIG } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { UserNav } from "@/components/layout/user-nav";
import { CommandPalette } from "@/components/common/command-palette";
import { SiteSelector } from "@/components/layout/site-selector";

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
                <MobileNav />
                <Link href="/" className="mr-4 shrink-0 text-sm font-bold lg:mr-6">
                    {SITE_CONFIG.name}
                </Link>
                <nav className="hidden lg:flex">
                    <DesktopNav />
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden lg:flex">
                        <SiteSelector />
                    </div>
                    <div className="hidden sm:flex">
                        <CommandPalette />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex">
                            <ThemeToggle />
                        </div>
                        <UserNav />
                    </div>
                </div>
            </div>
        </header>
    );
}
