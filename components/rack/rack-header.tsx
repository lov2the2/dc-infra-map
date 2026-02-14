import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import type { RackWithDevices } from "@/types/entities";

interface RackHeaderProps {
    rack: RackWithDevices;
    siteName?: string;
    locationName?: string;
    siteId?: string;
}

export function RackHeader({ rack, siteName, locationName, siteId }: RackHeaderProps) {
    const usedU = rack.devices.reduce((sum, d) => sum + d.deviceType.uHeight, 0);
    const utilization = Math.round((usedU / rack.uHeight) * 100);

    const breadcrumbs: { label: string; href?: string }[] = [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sites", href: "/sites" },
    ];
    if (siteId && siteName) {
        breadcrumbs.push({ label: siteName, href: `/sites/${siteId}` });
    }
    if (siteId && rack.locationId && locationName) {
        breadcrumbs.push({
            label: locationName,
            href: `/sites/${siteId}/locations/${rack.locationId}`,
        });
    }
    breadcrumbs.push({ label: rack.name });

    return (
        <PageHeader
            title={rack.name}
            breadcrumbs={breadcrumbs}
            description={`${rack.uHeight}U ${rack.type} rack — ${usedU}U used (${utilization}%)`}
            action={
                <Badge variant="outline" className="text-sm">
                    {rack.type}
                </Badge>
            }
        />
    );
}
