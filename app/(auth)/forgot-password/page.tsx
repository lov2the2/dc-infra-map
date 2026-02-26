"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");
        setResetLink("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error ?? "Something went wrong. Please try again.");
                return;
            }

            setMessage(json.data?.message ?? "Request submitted.");

            // In development, the API returns a resetToken for testing
            if (json.data?.resetToken) {
                const params = new URLSearchParams({ email, token: json.data.resetToken });
                setResetLink(`/reset-password?${params.toString()}`);
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        {message && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {message}
                                </p>
                                {resetLink && (
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">
                                            Reset link:{" "}
                                        </span>
                                        <Link
                                            href={resetLink}
                                            className="text-foreground hover:underline break-all"
                                        >
                                            {resetLink}
                                        </Link>
                                    </p>
                                )}
                            </div>
                        )}
                        {!message && (
                            <>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="email"
                                        className="text-sm font-medium"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="user@dcim.local"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? "Sending..."
                                        : "Send Reset Link"}
                                </Button>
                            </>
                        )}
                        <p className="text-center text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="hover:underline text-foreground"
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
