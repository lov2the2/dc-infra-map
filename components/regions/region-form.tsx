"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { regionCreateSchema, type RegionCreateInput } from "@/lib/validators/region";
import { generateSlug } from "@/lib/utils";
import type { Region } from "@/types/entities";

interface RegionFormProps {
    region?: Region;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function RegionForm({ region, open, onOpenChange, onSuccess }: RegionFormProps) {
    const isEditing = !!region;

    const form = useForm<RegionCreateInput>({
        resolver: zodResolver(regionCreateSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: region?.name ?? "",
                slug: region?.slug ?? "",
                description: region?.description ?? "",
            });
        }
    }, [open, region, form]);

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    async function onSubmit(data: RegionCreateInput) {
        const url = isEditing ? `/api/regions/${region.id}` : "/api/regions";
        const method = isEditing ? "PATCH" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            form.setError("root", { message: errorData?.error ?? "Failed to save region" });
            return;
        }

        onOpenChange(false);
        onSuccess();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Region" : "New Region"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="North America" {...field} />
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
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                        <Input placeholder="north-america" {...field} />
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
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting
                                    ? "Saving..."
                                    : isEditing
                                      ? "Save Changes"
                                      : "Create Region"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
