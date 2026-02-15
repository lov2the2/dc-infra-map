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
