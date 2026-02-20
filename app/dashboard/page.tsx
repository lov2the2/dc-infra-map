import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sites, racks, devices, tenants, accessLogs, powerFeeds } from "@/db/schema";
import { isNull, count, eq, desc } from "drizzle-orm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import Link from "next/link";
import { Building2, Server, HardDrive, Users, Zap, Shield } from "lucide-react";
import { AccessStatusBadge } from "@/components/access/access-status-badge";
import { SiteSummaryGrid } from "@/components/dashboard/site-summary-grid";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [sitesCount, racksCount, devicesCount, tenantsCount, feedsCount] = await Promise.all([
        db.select({ count: count() }).from(sites).where(isNull(sites.deletedAt)),
        db.select({ count: count() }).from(racks).where(isNull(racks.deletedAt)),
        db.select({ count: count() }).from(devices).where(isNull(devices.deletedAt)),
        db.select({ count: count() }).from(tenants).where(isNull(tenants.deletedAt)),
        db.select({ count: count() }).from(powerFeeds).where(isNull(powerFeeds.deletedAt)),
    ]);

    // Recent access logs
    const recentAccess = await db.query.accessLogs.findMany({
        where: isNull(accessLogs.deletedAt),
        with: { site: true },
        orderBy: [desc(accessLogs.checkInAt)],
        limit: 5,
    });

    // Active check-ins count
    const [activeCheckIns] = await db
        .select({ count: count() })
        .from(accessLogs)
        .where(eq(accessLogs.status, "checked_in"));

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
        {
            title: "Power Feeds",
            description: "Active power feeds",
            count: feedsCount[0]?.count ?? 0,
            href: "/power",
            icon: Zap,
        },
        {
            title: "Checked In",
            description: "Personnel on-site",
            count: activeCheckIns?.count ?? 0,
            href: "/access",
            icon: Shield,
        },
    ];

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Dashboard"
                description="Overview of your data center infrastructure"
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            {/* Per-site summary grid (visible when "All Sites" is active) */}
            <SiteSummaryGrid />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Access Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Access Activity</CardTitle>
                        <CardDescription>Last 5 access logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentAccess.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No access logs yet</p>
                        ) : (
                            <div className="space-y-3">
                                {recentAccess.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-medium">{log.personnelName}</span>
                                            <span className="text-muted-foreground ml-2">{log.site?.name}</span>
                                        </div>
                                        <AccessStatusBadge status={log.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Session Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Session Info</CardTitle>
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
        </div>
    );
}
