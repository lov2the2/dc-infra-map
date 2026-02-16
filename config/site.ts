import type { NavLink } from "@/types";

export const GITHUB_URL = "https://github.com/lov2the2";

export const SITE_CONFIG = {
    name: "DC Infra Map",
    description:
        "Data Center Infrastructure Management — rack elevation visualization, asset tracking, and change history logging.",
    url: "https://dcim.example.com",
} as const;

export const NAV_LINKS: NavLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Sites", href: "/sites" },
    { label: "Devices", href: "/devices" },
    { label: "Tenants", href: "/tenants" },
    { label: "Access", href: "/access" },
    { label: "Power", href: "/power" },
    { label: "Cables", href: "/cables" },
    { label: "Topology", href: "/topology" },
    { label: "Reports", href: "/reports" },
    { label: "Alerts", href: "/alerts" },
];

export const CTA_LINKS = {
    getStarted: { label: "Get Started", href: "/dashboard" },
    github: { label: "View on GitHub", href: GITHUB_URL },
} as const;

export const FOOTER_CONFIG = {
    credit: "DC Infra Map — Built with Next.js, Tailwind CSS & shadcn/ui",
} as const;
