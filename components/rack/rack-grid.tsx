"use client";

import type { RackWithDevices } from "@/types/entities";
import { RackSlot } from "./rack-slot";
import { DeviceBlock } from "./device-block";
import type { Device, DeviceType } from "@/types/entities";

function uPositionToGridRow(position: number, uHeight: number, rackHeight: number): number {
    return rackHeight - position - uHeight + 2;
}

interface RackGridProps {
    rack: RackWithDevices;
    activeFace: "front" | "rear";
}

export function RackGrid({ rack, activeFace }: RackGridProps) {
    const rackHeight = rack.uHeight;

    const faceDevices = rack.devices.filter(
        (d) => d.face === activeFace && d.position !== null,
    );

    const occupiedSlots = new Set<number>();
    faceDevices.forEach((device) => {
        for (let u = device.position!; u < device.position! + device.deviceType.uHeight; u++) {
            occupiedSlots.add(u);
        }
    });

    return (
        <div className="inline-block border rounded-lg bg-muted/30 overflow-hidden">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr",
                    gridTemplateRows: `repeat(${rackHeight}, 1.75rem)`,
                    width: "24rem",
                }}
            >
                {Array.from({ length: rackHeight }, (_, i) => {
                    const uPosition = rackHeight - i;
                    const gridRow = i + 1;
                    const isOccupied = occupiedSlots.has(uPosition);

                    return (
                        <div key={`label-${uPosition}`} className="contents">
                            <div
                                className="flex items-center justify-center text-[10px] text-muted-foreground border-b border-r bg-muted/50 font-mono"
                                style={{ gridRow, gridColumn: 1 }}
                            >
                                {uPosition}
                            </div>
                            {!isOccupied && (
                                <RackSlot
                                    position={uPosition}
                                    gridRow={gridRow}
                                    rackId={rack.id}
                                />
                            )}
                        </div>
                    );
                })}

                {faceDevices.map((device) => {
                    const startRow = uPositionToGridRow(
                        device.position!,
                        device.deviceType.uHeight,
                        rackHeight,
                    );
                    return (
                        <DeviceBlock
                            key={device.id}
                            device={device as Device & { deviceType: DeviceType }}
                            startRow={startRow}
                            uHeight={device.deviceType.uHeight}
                            sourceRackId={rack.id}
                        />
                    );
                })}
            </div>
        </div>
    );
}
