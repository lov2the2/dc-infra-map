import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ManufacturerNotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <h2 className="text-2xl font-bold">Manufacturer Not Found</h2>
            <p className="text-muted-foreground">
                The requested manufacturer does not exist or has been removed.
            </p>
            <Button asChild>
                <Link href="/manufacturers">Back to Manufacturers</Link>
            </Button>
        </div>
    );
}
