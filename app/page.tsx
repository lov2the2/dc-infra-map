import Link from "next/link";
import {
    BookOpen,
    Code,
    ExternalLink,
    Layers,
    Moon,
    Palette,
    Zap,
} from "lucide-react";

import { CTA_LINKS, SITE_CONFIG } from "@/config/site";
import type { DocItem, Feature } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const FEATURES: Feature[] = [
    {
        title: "Dark Mode",
        description:
            "Seamless light and dark theme switching with system preference detection.",
        icon: "moon",
    },
    {
        title: "Type Safe",
        description:
            "Built with TypeScript for robust type checking and better developer experience.",
        icon: "code",
    },
    {
        title: "Component Library",
        description:
            "Pre-configured shadcn/ui components that are accessible and customizable.",
        icon: "layers",
    },
    {
        title: "Fast & Modern",
        description:
            "Powered by Next.js App Router with server components and optimized performance.",
        icon: "zap",
    },
];

const FEATURE_ICON_MAP = {
    moon: Moon,
    code: Code,
    layers: Layers,
    zap: Zap,
} as const;

const DOCS_ITEMS: DocItem[] = [
    {
        title: "Getting Started",
        description:
            "Set up your development environment and create your first page.",
        icon: "zap",
    },
    {
        title: "Components",
        description:
            "Explore the pre-built UI components and learn how to customize them.",
        icon: "layers",
    },
    {
        title: "Theming",
        description:
            "Customize colors, typography, and dark mode to match your brand.",
        icon: "palette",
    },
];

const DOCS_ICON_MAP = {
    zap: BookOpen,
    layers: Code,
    palette: Palette,
} as const;

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="container flex flex-col items-center gap-6 py-24 text-center md:py-32">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Build Beautiful Web Apps{" "}
                    <span className="text-muted-foreground">in Minutes</span>
                </h1>
                <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
                    {SITE_CONFIG.description}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Button size="lg" asChild>
                        <Link href={CTA_LINKS.getStarted.href}>
                            {CTA_LINKS.getStarted.label}
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <a
                            href={CTA_LINKS.github.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {CTA_LINKS.github.label}
                        </a>
                    </Button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="container py-16 md:py-24">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Everything You Need
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        A carefully curated set of tools and patterns to
                        kickstart your next project.
                    </p>
                </div>
                <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
                    {FEATURES.map((feature) => {
                        const Icon =
                            FEATURE_ICON_MAP[
                                feature.icon as keyof typeof FEATURE_ICON_MAP
                            ];
                        return (
                            <Card key={feature.title}>
                                <CardHeader>
                                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Docs Section */}
            <section id="docs" className="container py-16 md:py-24">
                <div className="mx-auto mb-12 max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Documentation
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Learn how to get the most out of this starter kit.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {DOCS_ITEMS.map((doc) => {
                        const Icon =
                            DOCS_ICON_MAP[
                                doc.icon as keyof typeof DOCS_ICON_MAP
                            ];
                        return (
                            <Card key={doc.title}>
                                <CardHeader>
                                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle>{doc.title}</CardTitle>
                                    <CardDescription>
                                        {doc.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </>
    );
}
