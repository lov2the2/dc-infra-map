"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MovementApprovalDialogProps {
    movementId: string;
    action: "approve" | "reject";
}

export function MovementApprovalDialog({ movementId, action }: MovementApprovalDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isApprove = action === "approve";

    async function handleSubmit() {
        setIsSubmitting(true);
        const res = await fetch(`/api/equipment-movements/${movementId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: isApprove ? "approved" : "rejected",
                notes: notes || null,
            }),
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
                <Button variant={isApprove ? "default" : "destructive"}>
                    {isApprove ? "Approve" : "Reject"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isApprove ? "Approve Movement" : "Reject Movement"}</DialogTitle>
                    <DialogDescription>
                        {isApprove
                            ? "Approve this equipment movement request."
                            : "Reject this equipment movement request. Please provide a reason."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes {!isApprove && "(required)"}</Label>
                        <Textarea
                            id="notes"
                            placeholder={isApprove ? "Optional notes..." : "Reason for rejection..."}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant={isApprove ? "default" : "destructive"}
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!isApprove && !notes.trim())}
                    >
                        {isSubmitting ? "Processing..." : isApprove ? "Confirm Approve" : "Confirm Reject"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
