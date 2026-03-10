"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { siteCreateSchema, type SiteCreateInput } from "@/lib/validators/site";
import { generateSlug } from "@/lib/utils";
import type { Site } from "@/types/entities";
import { useApiMutation } from "@/hooks/use-api-mutation";

interface SiteFormProps {
    site?: Site;
}

const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "planned", label: "Planned" },
    { value: "staging", label: "Staging" },
    { value: "decommissioning", label: "Decommissioning" },
    { value: "retired", label: "Retired" },
] as const;

export function SiteForm({ site }: SiteFormProps) {
    const router = useRouter();
    const isEditing = !!site;

    const form = useForm<SiteCreateInput>({
        resolver: zodResolver(siteCreateSchema),
        defaultValues: {
            name: site?.name ?? "",
            slug: site?.slug ?? "",
            status: site?.status ?? "active",
            facility: site?.facility ?? "",
            address: site?.address ?? "",
            latitude: site?.latitude ?? undefined,
            longitude: site?.longitude ?? undefined,
            description: site?.description ?? "",
        },
    });

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    // Auto-generate slug from name when creating a new site
    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    const { mutate, isLoading } = useApiMutation<SiteCreateInput>({
        endpoint: isEditing ? `/api/sites/${site?.id}` : "/api/sites",
        method: isEditing ? "PATCH" : "POST",
        redirectPath: "/sites",
        onError: (errorMessage) => {
            form.setError("root", { message: errorMessage });
        },
    });

    async function onSubmit(data: SiteCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Site" : "Create Site"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Seoul Data Center" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="seoul-data-center"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="facility"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Facility</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Digital Complex Building A"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="123 Main Street, Seoul"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Latitude</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="37.5665"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val === "" ? null : parseFloat(val));
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Longitude</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="126.9780"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(val === "" ? null : parseFloat(val));
                                                }}
                                            />
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
                                        <Textarea
                                            placeholder="Optional description..."
                                            rows={3}
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.root.message}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Saving..."
                                    : isEditing
                                      ? "Save Changes"
                                      : "Create Site"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/sites")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
