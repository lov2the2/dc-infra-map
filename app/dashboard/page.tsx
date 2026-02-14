import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container space-y-6 py-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Sites</CardTitle>
                        <CardDescription>Manage data center sites</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">-</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Racks</CardTitle>
                        <CardDescription>Infrastructure racks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">-</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Devices</CardTitle>
                        <CardDescription>Active devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">-</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                        Logged in as <strong>{session.user.email}</strong> (
                        {session.user.role})
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
