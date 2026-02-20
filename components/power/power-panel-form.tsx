"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { powerPanelCreateSchema, type PowerPanelCreateInput } from "@/lib/validators/power";
import { generateSlug } from "@/lib/utils";
import type { Site, PowerPanel } from "@/types/entities";

interface PowerPanelFormProps {
    sites: Site[];
    panel?: PowerPanel;
}

export function PowerPanelForm({ sites, panel }: PowerPanelFormProps) {
    const isEditing = !!panel;

    const form = useForm<PowerPanelCreateInput>({
        resolver: zodResolver(powerPanelCreateSchema),
        defaultValues: {
            name: panel?.name ?? "",
            slug: panel?.slug ?? "",
            siteId: panel?.siteId ?? "",
            location: panel?.location ?? "",
            ratedCapacityKw: panel?.ratedCapacityKw ?? 0,
            voltageV: panel?.voltageV ?? 220,
            phaseType: panel?.phaseType ?? "single",
        },
    });

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    const { mutate, isLoading } = useApiMutation<PowerPanelCreateInput>({
        endpoint: isEditing ? `/api/power/panels/${panel.id}` : "/api/power/panels",
        method: isEditing ? "PATCH" : "POST",
        redirectPath: "/power/panels",
        onError: (error) => {
            form.setError("root", { message: error });
        },
    });

    async function onSubmit(data: PowerPanelCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Panel" : "Create Power Panel"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="siteId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sites.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input placeholder="Main Panel A" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl><Input placeholder="main-panel-a" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl><Input placeholder="UPS Room B2F" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="ratedCapacityKw"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capacity (kW)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="voltageV"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Voltage (V)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 220)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phaseType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phase</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="single">Single</SelectItem>
                                                <SelectItem value="three">Three-Phase</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Panel"}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/power/panels">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
