"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function PowerError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Failed to load Power Monitoring</CardTitle>
                    <CardDescription>
                        {error.message || "An unexpected error occurred."}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="gap-2">
                    <Button onClick={reset}>Try Again</Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
