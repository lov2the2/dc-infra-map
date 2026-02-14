"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PowerFeedWithRelations } from "@/types/entities";

interface PowerFeedListProps {
    feeds: PowerFeedWithRelations[];
}

export function PowerFeedList({ feeds }: PowerFeedListProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Panel</TableHead>
                    <TableHead>Rack</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Max Amps</TableHead>
                    <TableHead>Rated kW</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {feeds.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No power feeds found
                        </TableCell>
                    </TableRow>
                ) : (
                    feeds.map((feed) => (
                        <TableRow key={feed.id}>
                            <TableCell className="font-medium">{feed.name}</TableCell>
                            <TableCell>{feed.panel?.name ?? "-"}</TableCell>
                            <TableCell>{feed.rack?.name ?? "-"}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={
                                    feed.feedType === "primary"
                                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                        : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                                }>
                                    {feed.feedType}
                                </Badge>
                            </TableCell>
                            <TableCell>{feed.maxAmps}A</TableCell>
                            <TableCell>{feed.ratedKw} kW</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/power/feeds/${feed.id}`}>View</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
