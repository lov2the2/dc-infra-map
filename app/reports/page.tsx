import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { ExportCard } from "@/components/reports/export-card";
import { ImportDialog } from "@/components/reports/import-dialog";

export default async function ReportsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Reports"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Reports" },
                ]}
                description="Export data as Excel or XML, and import from CSV."
            />

            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Export</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <ExportCard
                        title="Rack Layout"
                        description="Export all racks with devices and positions."
                        formats={["xlsx", "xml"]}
                        endpoint="/api/export/racks"
                    />
                    <ExportCard
                        title="Device Inventory"
                        description="Export device list with types, locations, and tenants."
                        formats={["xlsx", "xml"]}
                        endpoint="/api/export/devices"
                        showTenant
                    />
                    <ExportCard
                        title="Power Report"
                        description="Export power panels and feeds."
                        formats={["xlsx"]}
                        endpoint="/api/export/power"
                    />
                    <ExportCard
                        title="Cable Table"
                        description="Export all cable connections."
                        formats={["xlsx"]}
                        endpoint="/api/export/cables"
                    />
                    <ExportCard
                        title="Access Logs"
                        description="Export access log history with date filtering."
                        formats={["xlsx"]}
                        endpoint="/api/export/access"
                        showSite
                        showDateRange
                    />
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Import</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <ImportDialog
                        title="Devices"
                        templateEndpoint="/api/import/templates/devices"
                        importEndpoint="/api/import/devices"
                        type="devices"
                    />
                    <ImportDialog
                        title="Cables"
                        templateEndpoint="/api/import/templates/cables"
                        importEndpoint="/api/import/cables"
                        type="cables"
                    />
                </div>
            </div>
        </div>
    );
}
