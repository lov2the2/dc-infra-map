"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { equipmentMovementCreateSchema, type EquipmentMovementCreateInput } from "@/lib/validators/access";
import type { Site, Rack } from "@/types/entities";

interface EquipmentMovementFormProps {
    sites: Site[];
    racks: Rack[];
}

export function EquipmentMovementForm({ sites, racks }: EquipmentMovementFormProps) {
    const router = useRouter();

    const form = useForm<EquipmentMovementCreateInput>({
        resolver: zodResolver(equipmentMovementCreateSchema),
        defaultValues: {
            siteId: "",
            rackId: null,
            deviceId: null,
            movementType: "install",
            description: "",
            serialNumber: "",
            assetTag: "",
            notes: "",
        },
    });

    async function onSubmit(data: EquipmentMovementCreateInput) {
        const response = await fetch("/api/equipment-movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            form.setError("root", { message: errorData?.error ?? "Failed to create movement" });
            return;
        }

        router.push("/access/equipment");
        router.refresh();
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>New Equipment Movement</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="siteId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select site" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sites.map((site) => (
                                                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="movementType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Movement Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="install">Install</SelectItem>
                                                <SelectItem value="remove">Remove</SelectItem>
                                                <SelectItem value="relocate">Relocate</SelectItem>
                                                <SelectItem value="rma">RMA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="rackId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rack (optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select rack" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {racks.map((rack) => (
                                                <SelectItem key={rack.id} value={rack.id}>{rack.name}</SelectItem>
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
                                name="serialNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SN-12345" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assetTag"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asset Tag</FormLabel>
                                        <FormControl>
                                            <Input placeholder="AT-12345" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the movement..." rows={3} {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                        )}
                        <div className="flex gap-3">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Creating..." : "Create Movement"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.push("/access/equipment")}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
