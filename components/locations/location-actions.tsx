"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface LocationActionsProps {
    locationId: string;
    siteId: string;
}

export function LocationActions({ locationId, siteId }: LocationActionsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/locations/${locationId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data?.error ?? "Failed to delete location.");
                return;
            }

            router.push(`/sites/${siteId}`);
            router.refresh();
        } catch {
            alert("An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/sites/${siteId}/locations/${locationId}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit</span>
                </Link>
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
            >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">{isDeleting ? "Deleting..." : "Delete"}</span>
            </Button>
        </div>
    );
}
