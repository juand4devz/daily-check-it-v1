"use client";

import { Monitor, Brain, BookOpen, ShieldCheck, Waypoints, PanelRightOpen, Database, Wrench, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const icons = {
    Monitor, Brain, BookOpen, ShieldCheck, Waypoints, PanelRightOpen, Database, Wrench, Rocket
};

const features = [
    {
        icon: "Monitor",
        title: "Diagnosa Mandiri",
        description: "Proses diagnosa mandiri langkah-demi-langkah untuk berbagai masalah perangkat."
    },
    {
        icon: "BookOpen",
        title: "Basis Pengetahuan",
        description: "Kumpulan artikel dan panduan solusi yang terkurasi untuk masalah umum teknologi."
    },
    {
        icon: "Wrench",
        title: "Penanganan Kesalahan",
        description: "Panduan untuk mengidentifikasi dan memperbaiki kesalahan yang sering terjadi."
    },
    {
        icon: "Brain",
        title: "Bantuan AI",
        description: "Analisis bertenaga AI dari gambar dan deskripsi untuk mengidentifikasi masalah teknis."
    },
    {
        icon: "Database",
        title: "Manajemen Pengetahuan",
        description: "Alat bagi teknisi untuk berkontribusi dan memperbarui basis pengetahuan."
    },
    {
        icon: "PanelRightOpen",
        title: "Personalisasi",
        description: "Sesuaikan pengalaman Anda dengan tema dan lainnya."
    },
    {
        icon: "Waypoints",
        title: "Dashboard Analitik",
        description: "Statistik dan wawasan komprehensif untuk para administrator."
    },
    {
        icon: "Rocket",
        title: "Optimalisasi Kinerja",
        description: "Panduan dan tips untuk meningkatkan kecepatan dan efisiensi perangkat Anda."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-20 md:py-28">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur-fitur Lengkap dalam Satu Platform</h2>
                    <p className="text-foreground/70 text-lg">
                        DailyCek.It menggabungkan fitur-fitur canggih untuk membantu mendiagnosis, memecahkan, dan berbagi solusi teknologi untuk semua perangkat Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, i) => {
                        const Icon = icons[feature.icon as keyof typeof icons];
                        return (
                            <Card
                                key={i}
                                className="border border-border h-full transition-all duration-300 hover:shadow-lg hover:border-primary"
                            >
                                <CardHeader className="pb-2">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-foreground/70 text-sm">{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}