"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { NAV_LINKS, SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
                <SheetHeader>
                    <SheetTitle>{SITE_CONFIG.name}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 px-4">
                    {NAV_LINKS.map((link) =>
                        link.external ? (
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                {link.label}
                            </a>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                {link.label}
                            </Link>
                        )
                    )}
                </nav>
                <div className="mt-auto border-t px-4 py-4">
                    <ThemeToggle />
                </div>
            </SheetContent>
        </Sheet>
    );
}
