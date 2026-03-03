export interface DeviceNode {
    id: string;
    name: string;
    type: string;
    interfaces: { id: string; name: string }[];
}

export interface Connection {
    cableId: string;
    label: string;
    cableType: string;
    status: string;
    sourceDeviceId: string;
    targetDeviceId: string;
    isPatchPanel?: boolean;
}

export interface PortData {
    id: string;
    name: string;
    deviceId: string;
    rearPortId?: string | null;
}

export interface RearPortData {
    id: string;
    name: string;
    deviceId: string;
}
