"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface SiteActionsProps {
    siteId: string;
}

export function SiteActions({ siteId }: SiteActionsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this site? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/sites/${siteId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data?.error ?? "Failed to delete site.");
                return;
            }

            router.push("/sites");
            router.refresh();
        } catch {
            alert("An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/sites/${siteId}/edit`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                </Link>
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? "Deleting..." : "Delete"}
            </Button>
        </div>
    );
}
