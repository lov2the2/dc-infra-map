import { XMLBuilder, XMLParser } from "fast-xml-parser";

export const DCIM_XML_VERSION = "1.0";

const builderOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
    suppressEmptyNode: true,
};

const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: true,
    trimValues: true,
};

export function buildXml(data: Record<string, unknown>, rootName: string): string {
    const builder = new XMLBuilder(builderOptions);
    const wrapped = {
        "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
        [rootName]: {
            "@_version": DCIM_XML_VERSION,
            "@_exportedAt": new Date().toISOString(),
            ...data,
        },
    };
    return builder.build(wrapped) as string;
}

export function parseXml(xmlString: string): Record<string, unknown> {
    const parser = new XMLParser(parserOptions);
    return parser.parse(xmlString) as Record<string, unknown>;
}
