import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function SiteNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Site Not Found</CardTitle>
                    <CardDescription>
                        The requested site does not exist or has been removed.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href="/sites">Back to Sites</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
