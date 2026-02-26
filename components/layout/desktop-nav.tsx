"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { NAV_GROUPS } from "@/config/site";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function DesktopNav() {
    const { data: session } = useSession();

    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                            Dashboard
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>

                {NAV_GROUPS.map((group) => (
                    <NavigationMenuItem key={group.label}>
                        <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[200px] gap-1 p-2">
                                {group.items.map((item) => (
                                    <li key={item.href}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href={item.href}
                                                className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                            >
                                                {item.label}
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                ))}

                {session?.user?.role === "admin" && (
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[200px] gap-1 p-2">
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href="/admin/users"
                                            className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                        >
                                            User Management
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}
