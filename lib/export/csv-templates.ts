export function getDeviceTemplate(): string {
    return [
        "name,deviceTypeId,rackId,status,position,serialNumber,assetTag,tenantId",
        "web-server-01,<device-type-uuid>,<rack-uuid>,active,1,SN-12345,AT-001,<tenant-uuid>",
    ].join("\n");
}

export function getCableTemplate(): string {
    return [
        "label,cableType,status,terminationAType,terminationAId,terminationBType,terminationBId,length,color,tenantId",
        "cable-001,cat6a,connected,interface,<interface-uuid>,interface,<interface-uuid>,3,,<tenant-uuid>",
    ].join("\n");
}

export function getSiteTemplate(): string {
    return [
        "name,slug,status,facility,address,latitude,longitude,description",
        "Seoul IDC,seoul-idc,active,Seoul Digital Complex,Seoul Geumcheon-gu,37.4779,126.8878,Main DC",
    ].join("\n");
}

export function getTenantTemplate(): string {
    return [
        "name,slug,description",
        "Acme Corp,acme-corp,Primary tenant organization",
    ].join("\n");
}
