"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";

import { NAV_GROUPS, SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SiteSelector } from "@/components/layout/site-selector";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col">
                <SheetHeader>
                    <SheetTitle>{SITE_CONFIG.name}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 px-4 flex-1 overflow-auto">
                    <Link
                        href="/dashboard"
                        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() => setOpen(false)}
                    >
                        Dashboard
                    </Link>

                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <Separator />
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.label}
                            </div>
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground block"
                                    onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    ))}

                    {session?.user?.role === "admin" && (
                        <div className="space-y-1">
                            <Separator />
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Admin
                            </div>
                            <Link
                                href="/admin/users"
                                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground block"
                                onClick={() => setOpen(false)}
                            >
                                User Management
                            </Link>
                        </div>
                    )}

                    <Separator />
                    <div className="px-3 py-2">
                        <SiteSelector />
                    </div>
                </nav>
                <div className="mt-auto border-t px-4 py-4">
                    <ThemeToggle />
                </div>
            </SheetContent>
        </Sheet>
    );
}
