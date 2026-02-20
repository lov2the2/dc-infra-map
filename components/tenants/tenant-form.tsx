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
import { tenantCreateSchema, type TenantCreateInput } from "@/lib/validators/tenant";
import { generateSlug } from "@/lib/utils";
import type { Tenant } from "@/types/entities";
import { useApiMutation } from "@/hooks/use-api-mutation";

interface TenantFormProps {
    tenant?: Tenant;
}

export function TenantForm({ tenant }: TenantFormProps) {
    const router = useRouter();
    const isEditing = !!tenant;

    const form = useForm<TenantCreateInput>({
        resolver: zodResolver(tenantCreateSchema),
        defaultValues: {
            name: tenant?.name ?? "",
            slug: tenant?.slug ?? "",
            description: tenant?.description ?? "",
        },
    });

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    // Auto-generate slug from name when creating a new tenant
    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    const { mutate, isLoading } = useApiMutation<TenantCreateInput>({
        endpoint: isEditing ? `/api/tenants/${tenant?.id}` : "/api/tenants",
        method: isEditing ? "PATCH" : "POST",
        redirectPath: "/tenants",
        onError: (errorMessage) => {
            form.setError("root", { message: errorMessage });
        },
    });

    async function onSubmit(data: TenantCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Tenant" : "Create Tenant"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corporation" {...field} />
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
                                        <Input
                                            placeholder="acme-corporation"
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
                                      : "Create Tenant"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/tenants")}
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
