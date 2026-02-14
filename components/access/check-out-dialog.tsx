"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CheckOutDialogProps {
    logId: string;
    personnelName: string;
}

export function CheckOutDialog({ logId, personnelName }: CheckOutDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleCheckOut() {
        setIsSubmitting(true);
        const res = await fetch(`/api/access-logs/${logId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkOutNote: note || null }),
        });

        if (res.ok) {
            setOpen(false);
            router.refresh();
        }
        setIsSubmitting(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Check Out</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Check Out</DialogTitle>
                    <DialogDescription>
                        Check out {personnelName} from the facility.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="Any notes about the visit..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCheckOut} disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : "Confirm Check Out"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
