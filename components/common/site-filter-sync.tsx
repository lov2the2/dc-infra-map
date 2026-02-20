"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSiteStore } from "@/stores/use-site-store";

/**
 * Invisible component that synchronizes the Zustand activeSiteId into the
 * URL search parameter `siteId`. When mounted on a page, any change to the
 * global site selector will update the URL, causing the server component to
 * re-fetch data filtered by the selected site.
 */
export function SiteFilterSync() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeSiteId = useSiteStore((s) => s.activeSiteId);

    // Track previous value to avoid unnecessary pushes
    const prevSiteId = useRef<string | null>(undefined);

    useEffect(() => {
        // Skip initial mount sync to avoid double navigation on first load
        if (prevSiteId.current === undefined) {
            prevSiteId.current = activeSiteId;
            return;
        }

        if (prevSiteId.current === activeSiteId) return;
        prevSiteId.current = activeSiteId;

        const params = new URLSearchParams(searchParams.toString());
        if (activeSiteId) {
            params.set("siteId", activeSiteId);
        } else {
            params.delete("siteId");
        }

        // Remove page param on site change to avoid stale pagination
        params.delete("page");

        router.push(`${pathname}?${params.toString()}`);
    }, [activeSiteId, pathname, router, searchParams]);

    return null;
}
