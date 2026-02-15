"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: UserData | null;
    onSuccess: () => void;
}

const ROLES = [
    { value: "admin", label: "Admin" },
    { value: "operator", label: "Operator" },
    { value: "viewer", label: "Viewer" },
    { value: "tenant_viewer", label: "Tenant Viewer" },
];

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
    const isEditing = !!user;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(user?.role ?? "viewer");

    // Reset form when dialog opens with new data
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setPassword("");
            setRole(user?.role ?? "viewer");
            setError(null);
        }
        onOpenChange(isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const body: Record<string, string> = { name, email, role };
            if (password) body.password = password;

            const url = isEditing ? `/api/admin/users/${user.id}` : "/api/admin/users";
            const method = isEditing ? "PATCH" : "POST";

            if (!isEditing && !password) {
                setError("Password is required for new users");
                setLoading(false);
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to save user");
                return;
            }

            onOpenChange(false);
            onSuccess();
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the user's information below."
                            : "Fill in the details to create a new user."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Password {isEditing && "(leave blank to keep current)"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isEditing ? "••••••••" : "Enter password"}
                                required={!isEditing}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
