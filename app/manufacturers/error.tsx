"use client";

import { RouteError } from "@/components/common/route-error";

export default function ManufacturersError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteError
            title="Failed to load manufacturers"
            error={error}
            reset={reset}
        />
    );
}
