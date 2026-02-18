import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function RackPowerNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Rack Power Not Found</CardTitle>
                    <CardDescription>
                        The requested rack power data does not exist or has been
                        removed.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href="/power">Back to Power</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
