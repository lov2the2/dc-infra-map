import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    async rewrites() {
        const coreApiUrl = process.env.CORE_API_URL ?? "http://localhost:8081";
        const powerServiceUrl = process.env.GO_SERVICE_URL ?? "http://localhost:8080";
        const netopsUrl = process.env.NETWORK_OPS_URL ?? "http://localhost:8082";
        return [
            // Core API Service
            { source: "/api/sites/:path*", destination: `${coreApiUrl}/sites/:path*` },
            { source: "/api/sites", destination: `${coreApiUrl}/sites` },
            { source: "/api/regions/:path*", destination: `${coreApiUrl}/regions/:path*` },
            { source: "/api/regions", destination: `${coreApiUrl}/regions` },
            { source: "/api/locations/:path*", destination: `${coreApiUrl}/locations/:path*` },
            { source: "/api/locations", destination: `${coreApiUrl}/locations` },
            { source: "/api/racks/:path*", destination: `${coreApiUrl}/racks/:path*` },
            { source: "/api/racks", destination: `${coreApiUrl}/racks` },
            { source: "/api/devices/batch", destination: `${coreApiUrl}/devices/batch` },
            { source: "/api/devices/:path*", destination: `${coreApiUrl}/devices/:path*` },
            { source: "/api/devices", destination: `${coreApiUrl}/devices` },
            { source: "/api/device-types/:path*", destination: `${coreApiUrl}/device-types/:path*` },
            { source: "/api/device-types", destination: `${coreApiUrl}/device-types` },
            { source: "/api/manufacturers/:path*", destination: `${coreApiUrl}/manufacturers/:path*` },
            { source: "/api/manufacturers", destination: `${coreApiUrl}/manufacturers` },
            { source: "/api/tenants/:path*", destination: `${coreApiUrl}/tenants/:path*` },
            { source: "/api/tenants", destination: `${coreApiUrl}/tenants` },
            { source: "/api/dashboard/:path*", destination: `${coreApiUrl}/dashboard/:path*` },
            // Power Service
            { source: "/api/power/readings", destination: `${powerServiceUrl}/readings` },
            { source: "/api/power/sse", destination: `${powerServiceUrl}/sse` },
            { source: "/api/power/panels/:path*", destination: `${powerServiceUrl}/panels/:path*` },
            { source: "/api/power/panels", destination: `${powerServiceUrl}/panels` },
            { source: "/api/power/feeds/:path*", destination: `${powerServiceUrl}/feeds/:path*` },
            { source: "/api/power/feeds", destination: `${powerServiceUrl}/feeds` },
            { source: "/api/power/summary", destination: `${powerServiceUrl}/summary` },
            { source: "/api/export/:path*", destination: `${powerServiceUrl}/export/:path*` },
            // Network & Operations Service
            { source: "/api/cables/trace/:path*", destination: `${netopsUrl}/cables/trace/:path*` },
            { source: "/api/cables/:path*", destination: `${netopsUrl}/cables/:path*` },
            { source: "/api/cables", destination: `${netopsUrl}/cables` },
            { source: "/api/interfaces/:path*", destination: `${netopsUrl}/interfaces/:path*` },
            { source: "/api/interfaces", destination: `${netopsUrl}/interfaces` },
            { source: "/api/console-ports/:path*", destination: `${netopsUrl}/console-ports/:path*` },
            { source: "/api/console-ports", destination: `${netopsUrl}/console-ports` },
            { source: "/api/front-ports/:path*", destination: `${netopsUrl}/front-ports/:path*` },
            { source: "/api/front-ports", destination: `${netopsUrl}/front-ports` },
            { source: "/api/rear-ports/:path*", destination: `${netopsUrl}/rear-ports/:path*` },
            { source: "/api/rear-ports", destination: `${netopsUrl}/rear-ports` },
            { source: "/api/access-logs/:path*", destination: `${netopsUrl}/access-logs/:path*` },
            { source: "/api/access-logs", destination: `${netopsUrl}/access-logs` },
            { source: "/api/equipment-movements/:path*", destination: `${netopsUrl}/equipment-movements/:path*` },
            { source: "/api/equipment-movements", destination: `${netopsUrl}/equipment-movements` },
            { source: "/api/alerts/:path*", destination: `${netopsUrl}/alerts/:path*` },
            { source: "/api/reports/:path*", destination: `${netopsUrl}/reports/:path*` },
            { source: "/api/audit-logs", destination: `${netopsUrl}/audit-logs` },
            { source: "/api/import/:path*", destination: `${netopsUrl}/import/:path*` },
        ];
    },
};

export default nextConfig;
