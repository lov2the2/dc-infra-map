import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    async rewrites() {
        const goServiceUrl = process.env.GO_SERVICE_URL ?? "http://localhost:8080";
        return [
            { source: "/api/power/readings", destination: `${goServiceUrl}/readings` },
            { source: "/api/power/sse", destination: `${goServiceUrl}/sse` },
            { source: "/api/export/:path*", destination: `${goServiceUrl}/export/:path*` },
        ];
    },
};

export default nextConfig;
