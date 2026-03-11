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
import { locationCreateSchema, type LocationCreateInput } from "@/lib/validators/location";
import { generateSlug } from "@/lib/utils";
import type { Location } from "@/types/entities";
import { useApiMutation } from "@/hooks/use-api-mutation";

interface LocationFormProps {
    location?: Location;
    siteId: string;
}

export function LocationForm({ location, siteId }: LocationFormProps) {
    const router = useRouter();
    const isEditing = !!location;

    const form = useForm<LocationCreateInput>({
        resolver: zodResolver(locationCreateSchema),
        defaultValues: {
            name: location?.name ?? "",
            slug: location?.slug ?? "",
            siteId: siteId,
            tenantId: location?.tenantId ?? null,
            description: location?.description ?? "",
        },
    });

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    // Auto-generate slug from name when creating a new location
    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    const { mutate, isLoading } = useApiMutation<LocationCreateInput>({
        endpoint: isEditing ? `/api/locations/${location?.id}` : "/api/locations",
        method: isEditing ? "PATCH" : "POST",
        redirectPath: `/sites/${siteId}`,
        onError: (errorMessage) => {
            form.setError("root", { message: errorMessage });
        },
    });

    async function onSubmit(data: LocationCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Location" : "Create Location"}</CardTitle>
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
                                        <Input placeholder="Floor 1 - Hall A" {...field} />
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
                                            placeholder="floor-1-hall-a"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                      : "Create Location"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/sites/${siteId}`)}
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
