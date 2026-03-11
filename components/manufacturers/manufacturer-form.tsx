"use client";

import { useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, XCircle } from "lucide-react";
import { manufacturerCreateSchema, type ManufacturerCreateInput } from "@/lib/validators/manufacturer";
import { generateSlug } from "@/lib/utils";
import type { Manufacturer } from "@/types/entities";

interface ManufacturerFormProps {
    manufacturer?: Pick<Manufacturer, "id" | "name" | "slug" | "description">;
}

interface SimilarCheck {
    exact: boolean;
    similar: { id: string; name: string }[];
}

export function ManufacturerForm({ manufacturer }: ManufacturerFormProps) {
    const router = useRouter();
    const isEditing = !!manufacturer;

    const [isLoading, setIsLoading] = useState(false);
    const [similarCheck, setSimilarCheck] = useState<SimilarCheck | null>(null);
    const [checkLoading, setCheckLoading] = useState(false);
    const [confirmedSimilar, setConfirmedSimilar] = useState(false);

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const form = useForm<ManufacturerCreateInput>({
        resolver: zodResolver(manufacturerCreateSchema),
        defaultValues: {
            name: manufacturer?.name ?? "",
            slug: manufacturer?.slug ?? "",
            description: manufacturer?.description ?? "",
        },
    });

    // useWatch is compatible with the React Compiler; form.watch() is not.
    const nameValue = useWatch({ control: form.control, name: "name" });

    // Auto-generate slug from name when creating a new manufacturer
    useEffect(() => {
        if (!isEditing && nameValue) {
            form.setValue("slug", generateSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, isEditing, form]);

    // Debounced similarity check
    useEffect(() => {
        if (!nameValue?.trim()) {
            setSimilarCheck(null);
            setConfirmedSimilar(false);
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            setCheckLoading(true);
            try {
                const params = new URLSearchParams({ q: nameValue.trim() });
                if (manufacturer?.id) {
                    params.set("excludeId", manufacturer.id);
                }
                const res = await fetch(`/api/manufacturers/search?${params}`);
                if (res.ok) {
                    const json = await res.json();
                    const result: SimilarCheck = json.data;
                    setSimilarCheck(result);
                    // Reset confirmation if name changed
                    setConfirmedSimilar(false);
                }
            } finally {
                setCheckLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [nameValue, manufacturer?.id]);

    const hasExactMatch = similarCheck?.exact === true;
    const hasSimilar = (similarCheck?.similar?.length ?? 0) > 0;

    // Submit is blocked if exact match or if similar but not confirmed
    const isSubmitBlocked = hasExactMatch || (hasSimilar && !confirmedSimilar);

    async function onSubmit(data: ManufacturerCreateInput) {
        if (isSubmitBlocked) return;

        setIsLoading(true);
        try {
            const endpoint = isEditing
                ? `/api/manufacturers/${manufacturer.id}`
                : "/api/manufacturers";
            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                form.setError("root", {
                    message: errorData?.error ?? "Operation failed",
                });
                return;
            }

            const responseData = await res.json().catch(() => ({}));
            // Navigate to the detail page of the created/updated manufacturer
            const savedId = responseData?.data?.id ?? responseData?.data?.data?.id ?? manufacturer?.id;
            if (savedId) {
                router.push(`/manufacturers/${savedId}`);
                router.refresh();
            } else {
                router.push("/manufacturers");
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>
                    {isEditing ? "Edit Manufacturer" : "Create Manufacturer"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cisco Systems" {...field} />
                                    </FormControl>
                                    <FormMessage />

                                    {/* Similarity check results */}
                                    {!checkLoading && hasExactMatch && (
                                        <Alert variant="destructive" className="mt-2">
                                            <XCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                A manufacturer with this exact name already exists. Please use a different name.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {!checkLoading && !hasExactMatch && hasSimilar && (
                                        <Alert className="mt-2 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription className="space-y-2">
                                                <p>Similar manufacturers already exist:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {similarCheck?.similar.map((m) => (
                                                        <li key={m.id} className="text-sm font-medium">
                                                            {m.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Checkbox
                                                        id="confirm-similar"
                                                        checked={confirmedSimilar}
                                                        onCheckedChange={(checked) =>
                                                            setConfirmedSimilar(checked === true)
                                                        }
                                                    />
                                                    <label
                                                        htmlFor="confirm-similar"
                                                        className="text-sm cursor-pointer"
                                                    >
                                                        I understand and want to create this manufacturer anyway
                                                    </label>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Slug <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="cisco-systems" {...field} />
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
                                disabled={isLoading || isSubmitBlocked}
                            >
                                {isLoading
                                    ? "Saving..."
                                    : isEditing
                                      ? "Save Changes"
                                      : "Create Manufacturer"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(
                                        isEditing
                                            ? `/manufacturers/${manufacturer.id}`
                                            : "/manufacturers"
                                    )
                                }
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
