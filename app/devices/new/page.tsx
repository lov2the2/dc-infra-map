import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { DeviceForm } from "@/components/devices/device-form";

export default async function NewDevicePage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="New Device"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Devices", href: "/devices" },
                    { label: "New Device" },
                ]}
            />
            <DeviceForm />
        </div>
    );
}
