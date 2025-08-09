// /components/landing-page/Benefits.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const benefits = [
    {
        title: "Diagnosa Otomatis",
        description:
            "Sistem kami menganalisis masalah umum pada perangkat Anda dan memberikan laporan yang jelas dan mudah dipahami.",
    },
    {
        title: "Basis Pengetahuan Terpadu",
        description:
            "Akses ke ribuan artikel, tutorial, dan panduan untuk menyelesaikan berbagai masalah teknologi, dari perangkat lunak hingga perangkat keras.",
    },
    {
        title: "Dukungan AI Cerdas",
        description: "Asisten AI kami siap membantu Anda 24/7 dengan solusi instan dan panduan terpersonalisasi.",
    },
    {
        title: "Wawasan Berbasis Data",
        description:
            "Dashboard admin menyediakan analitik untuk perbaikan berkelanjutan dan pemahaman tren masalah teknis.",
    },
    {
        title: "Antarmuka Intuitif",
        description:
            "Alur kerja yang jelas dan desain yang ramah pengguna untuk semua tingkat pengalaman, baik pemula maupun ahli.",
    },
    {
        title: "Dukungan Multi-Perangkat",
        description:
            "Desain responsif memastikan pengalaman yang mulus di semua perangkat, termasuk desktop, tablet, dan ponsel.",
    },
];

export default function Benefits() {
    return (
        <section id="benefits" className="py-10 md:py-18 px-8 bg-muted/30 rounded-lg">
            <div className="container">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left side - Image */}
                    <div className="order-2 md:order-1 relative">
                        <div className="relative rounded-xl overflow-hidden border shadow-xl">
                            <Image
                                src="/placeholder.svg"
                                alt="DailyCek.It Platform in Action"
                                width={600}
                                height={500}
                                className="object-cover"
                            />
                        </div>
                        {/* Hapus floating badge komunitas/multi-bahasa */}
                    </div>

                    {/* Right side - Content */}
                    <div className="order-1 md:order-2">
                        <Badge className="mb-4">Mengapa memilih DailyCek.It?</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Manfaat yang Membuat Perbedaan
                        </h2>
                        <p className="text-foreground/70 mb-8">
                            DailyCek.It menyediakan pendekatan komprehensif untuk pemecahan
                            masalah teknologi, dengan fitur-fitur yang dirancang untuk
                            memberdayakan pengguna agar bisa mengatasi masalah secara mandiri.
                        </p>

                        <Accordion type="single" collapsible className="pr-5">
                            {benefits.map((benefit, i) => (
                                <AccordionItem key={i} value={`item-${i}`}>
                                    <AccordionTrigger>
                                        {benefit.title}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {benefit.description}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}