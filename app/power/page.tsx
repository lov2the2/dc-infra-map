import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { PowerDashboard } from "@/components/power/power-dashboard";
import { MockDataControls } from "@/components/power/mock-data-controls";
import { Settings } from "lucide-react";

export default async function PowerPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Power Monitoring"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power" },
                ]}
                action={
                    <Button variant="outline" asChild>
                        <Link href="/power/panels">
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Panels
                        </Link>
                    </Button>
                }
            />
            <MockDataControls />
            <PowerDashboard />
        </div>
    );
}
