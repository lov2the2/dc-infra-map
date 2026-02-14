"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRackStore } from "@/stores/use-rack-store";

export function RackFaceToggle() {
    const { activeFace, setActiveFace } = useRackStore();

    return (
        <Tabs value={activeFace} onValueChange={(v) => setActiveFace(v as "front" | "rear")}>
            <TabsList>
                <TabsTrigger value="front">Front</TabsTrigger>
                <TabsTrigger value="rear">Rear</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
