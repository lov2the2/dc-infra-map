import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "topology-node-positions";

function loadSavedPositions(): Record<string, { x: number; y: number }> {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return {};
        }
    }
    return {};
}

export interface UseNodePositionsResult {
    nodePositions: Record<string, { x: number; y: number }>;
    draggingDeviceId: string | null;
    handlePointerDown: (deviceId: string, e: React.PointerEvent<SVGGElement>) => void;
    handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
    handlePointerUp: () => void;
    resetPositions: () => void;
}

export function useNodePositions(deviceIds: string[]): UseNodePositionsResult {
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(loadSavedPositions);
    const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (Object.keys(nodePositions).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nodePositions));
        }
    }, [nodePositions]);

    const getPosition = useCallback((deviceId: string) => {
        if (nodePositions[deviceId]) return nodePositions[deviceId];
        const index = deviceIds.indexOf(deviceId);
        const total = deviceIds.length;
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return { x: 60 + col * 200, y: 60 + row * 140 };
    }, [nodePositions, deviceIds]);

    const handlePointerDown = useCallback((deviceId: string, e: React.PointerEvent<SVGGElement>) => {
        const svg = e.currentTarget.ownerSVGElement;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const currentPos = getPosition(deviceId);
        setDraggingDeviceId(deviceId);
        setDragOffset({ x: svgPt.x - currentPos.x, y: svgPt.y - currentPos.y });
    }, [getPosition]);

    const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        if (!draggingDeviceId) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        setNodePositions((prev) => ({
            ...prev,
            [draggingDeviceId]: {
                x: svgPt.x - dragOffset.x,
                y: svgPt.y - dragOffset.y,
            },
        }));
    }, [draggingDeviceId, dragOffset]);

    const handlePointerUp = useCallback(() => {
        setDraggingDeviceId(null);
    }, []);

    const resetPositions = useCallback(() => {
        setNodePositions({});
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        nodePositions,
        draggingDeviceId,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        resetPositions,
    };
}
