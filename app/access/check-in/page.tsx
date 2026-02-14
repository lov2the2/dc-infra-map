import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { sites } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { CheckInForm } from "@/components/access/check-in-form";

export default async function CheckInPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const siteList = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Personnel Check-In"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access", href: "/access" },
                    { label: "Check In" },
                ]}
            />
            <CheckInForm sites={siteList} />
        </div>
    );
}
