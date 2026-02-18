import Link from "next/link";

import { NAV_LINKS, SITE_CONFIG } from "@/config/site";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserNav } from "@/components/layout/user-nav";
import { CommandPalette } from "@/components/common/command-palette";

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <MobileNav />
                <Link href="/" className="mr-6 font-bold">
                    {SITE_CONFIG.name}
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                    {NAV_LINKS.map((link) =>
                        link.external ? (
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </a>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        )
                    )}
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <div className="hidden md:flex">
                        <CommandPalette />
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <ThemeToggle />
                        <UserNav />
                    </div>
                </div>
            </div>
        </header>
    );
}
