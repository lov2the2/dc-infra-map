import { ApiReference } from "@scalar/nextjs-api-reference";
import { openApiSpec } from "@/lib/swagger/openapi";

const config = {
    spec: {
        content: openApiSpec,
    },
    metaData: {
        title: "DC Infra Map - API Reference",
    },
};

export const GET = ApiReference(config);
