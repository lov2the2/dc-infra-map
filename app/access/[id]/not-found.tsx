import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AccessLogNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Access Log Not Found</CardTitle>
                    <CardDescription>
                        The requested access log does not exist or has been
                        removed.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href="/access">Back to Access</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
