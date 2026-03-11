"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { powerFeedCreateSchema, type PowerFeedCreateInput } from "@/lib/validators/power";
import type { PowerPanel, Rack, PowerFeed } from "@/types/entities";

interface PowerFeedFormProps {
    panels: PowerPanel[];
    racks: Rack[];
    feed?: PowerFeed;
}

export function PowerFeedForm({ panels, racks, feed }: PowerFeedFormProps) {
    const isEditing = !!feed;

    const form = useForm<PowerFeedCreateInput>({
        resolver: zodResolver(powerFeedCreateSchema),
        defaultValues: {
            panelId: feed?.panelId ?? "",
            rackId: feed?.rackId ?? null,
            name: feed?.name ?? "",
            feedType: feed?.feedType ?? "primary",
            maxAmps: feed?.maxAmps ?? 0,
            ratedKw: feed?.ratedKw ?? 0,
        },
    });

    const { mutate, isLoading } = useApiMutation<PowerFeedCreateInput>({
        endpoint: isEditing ? `/api/power/feeds/${feed.id}` : "/api/power/feeds",
        method: isEditing ? "PATCH" : "POST",
        redirectPath: "/power/feeds",
        onError: (error) => {
            form.setError("root", { message: error });
        },
    });

    async function onSubmit(data: PowerFeedCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Feed" : "Create Power Feed"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="panelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Panel <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={panels.map((p) => ({ value: p.id, label: p.name }))}
                                                placeholder="Select panel"
                                                searchPlaceholder="Search panel..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rackId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rack (optional)</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                value={field.value ?? ""}
                                                onValueChange={(v) => field.onChange(v || null)}
                                                options={racks.map((r) => ({ value: r.id, label: r.name }))}
                                                placeholder="Select rack"
                                                searchPlaceholder="Search rack..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input placeholder="A-Feed Primary" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="feedType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <FormControl>
                                            <SearchableSelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                options={[
                                                    { value: "primary", label: "Primary" },
                                                    { value: "redundant", label: "Redundant" },
                                                ]}
                                                placeholder="Select type"
                                                searchPlaceholder="Search..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxAmps"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Amps <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ratedKw"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rated kW <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {form.formState.errors.root && (
                            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                        )}
                        <div className="flex gap-3">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Feed"}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/power/feeds">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
