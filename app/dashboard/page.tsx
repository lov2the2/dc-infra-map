import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sites, racks, devices, tenants } from "@/db/schema";
import { isNull, count } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import Link from "next/link";
import { Building2, Server, HardDrive, Users } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [sitesCount, racksCount, devicesCount, tenantsCount] = await Promise.all([
        db.select({ count: count() }).from(sites).where(isNull(sites.deletedAt)),
        db.select({ count: count() }).from(racks).where(isNull(racks.deletedAt)),
        db.select({ count: count() }).from(devices).where(isNull(devices.deletedAt)),
        db.select({ count: count() }).from(tenants).where(isNull(tenants.deletedAt)),
    ]);

    const stats = [
        {
            title: "Sites",
            description: "Data center sites",
            count: sitesCount[0]?.count ?? 0,
            href: "/sites",
            icon: Building2,
        },
        {
            title: "Racks",
            description: "Infrastructure racks",
            count: racksCount[0]?.count ?? 0,
            href: "/racks",
            icon: Server,
        },
        {
            title: "Devices",
            description: "Active devices",
            count: devicesCount[0]?.count ?? 0,
            href: "/devices",
            icon: HardDrive,
        },
        {
            title: "Tenants",
            description: "Tenant organizations",
            count: tenantsCount[0]?.count ?? 0,
            href: "/tenants",
            icon: Users,
        },
    ];

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Dashboard"
                description="Overview of your data center infrastructure"
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.href} href={stat.href} className="block">
                            <Card className="hover:bg-muted/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Session Info</CardTitle>
                    <CardDescription>Currently logged in user</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Logged in as <strong>{session.user.email}</strong> (
                        {session.user.role})
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
