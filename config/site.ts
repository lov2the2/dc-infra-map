import type { NavLink } from "@/types";

export const GITHUB_URL = "https://github.com/lov2the2";

export const SITE_CONFIG = {
    name: "Starter Kit",
    description:
        "A modern web starter kit built with Next.js, Tailwind CSS, and shadcn/ui. Start building beautiful, responsive web applications in minutes.",
    url: "https://starter-kit.example.com",
} as const;

export const NAV_LINKS: NavLink[] = [
    { label: "Features", href: "#features" },
    { label: "Docs", href: "#docs" },
    { label: "GitHub", href: GITHUB_URL, external: true },
];

export const CTA_LINKS = {
    getStarted: { label: "Get Started", href: "#features" },
    github: { label: "View on GitHub", href: GITHUB_URL },
} as const;

export const FOOTER_CONFIG = {
    credit: "Built with Next.js, Tailwind CSS & shadcn/ui",
} as const;
