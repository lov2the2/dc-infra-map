"use client";

import { RouteError } from "@/components/common/route-error";

export default function AccessError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <RouteError error={error} reset={reset} title="Failed to load Access Logs" />;
}
