"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useApiMutation } from "@/hooks/use-api-mutation";
import { accessLogCreateSchema, type AccessLogCreateInput } from "@/lib/validators/access";
import type { Site } from "@/types/entities";

interface CheckInFormProps {
    sites: Site[];
}

export function CheckInForm({ sites }: CheckInFormProps) {
    const form = useForm<AccessLogCreateInput>({
        resolver: zodResolver(accessLogCreateSchema),
        defaultValues: {
            personnelName: "",
            company: "",
            contactPhone: "",
            accessType: "visit",
            purpose: "",
            escortName: "",
            badgeNumber: "",
            siteId: "",
        },
    });

    const { mutate, isLoading } = useApiMutation<AccessLogCreateInput>({
        endpoint: "/api/access-logs",
        redirectPath: "/access",
        onError: (error) => {
            form.setError("root", { message: error });
        },
    });

    async function onSubmit(data: AccessLogCreateInput) {
        await mutate(data);
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Personnel Check-In</CardTitle>
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
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select site" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sites.map((site) => (
                                                <SelectItem key={site.id} value={site.id}>
                                                    {site.name}
                                                </SelectItem>
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
                                name="personnelName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Hong Gildong" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Company name" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="010-1234-5678" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accessType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Access Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="visit">Visit</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                <SelectItem value="delivery">Delivery</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                                <SelectItem value="tour">Tour</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="escortName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Escort</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Escort name" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="badgeNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Badge Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="V-001" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purpose</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Purpose of visit..." rows={3} {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                        )}
                        <div className="flex gap-3">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Checking In..." : "Check In"}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/access">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
