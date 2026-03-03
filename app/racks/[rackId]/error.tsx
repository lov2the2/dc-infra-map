"use client";

import { RouteError } from "@/components/common/route-error";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <RouteError title="Failed to load details" error={error} reset={reset} />;
}
