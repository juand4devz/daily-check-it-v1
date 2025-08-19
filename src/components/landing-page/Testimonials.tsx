"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import Marquee from "@/components/ui/marquee"; // Import komponen Marquee yang baru dibuat

const testimonials = [
    {
        name: "Produk A",
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eget tincidunt magna, at ullamcorper tortor.",
        avatar: "PA",
        link: "https://example.com/product/a"
    },
    {
        name: "Layanan B",
        content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
        avatar: "LB",
        link: "https://example.com/service/b"
    },
    {
        name: "Fitur C",
        content: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos.",
        avatar: "FC",
        link: "https://example.com/feature/c"
    },
    {
        name: "Paket D",
        content: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        avatar: "PD",
        link: "https://example.com/package/d"
    },
    {
        name: "Solusi E",
        content: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        avatar: "SE",
        link: "https://example.com/solution/e"
    },
    {
        name: "Modul F",
        content: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
        avatar: "MF",
        link: "https://example.com/module/f"
    },
    {
        name: "Alat G",
        content: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
        avatar: "AG",
        link: "https://example.com/tool/g"
    },
    {
        name: "Platform H",
        content: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.",
        avatar: "PH",
        link: "https://example.com/platform/h"
    },
    {
        name: "Aplikasi I",
        content: "Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
        avatar: "AI",
        link: "https://example.com/app/i"
    },
    {
        name: "Sistem J",
        content: "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.",
        avatar: "SJ",
        link: "https://example.com/system/j"
    },
    {
        name: "Komponen K",
        content: "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
        avatar: "KK",
        link: "https://example.com/component/k"
    }
];

// Komponen Card Testimonial tetap sama
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <Card className="h-full border border-border transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${testimonial.avatar}&background=random`} />
                        <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-medium">@{testimonial.name}</h3>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={testimonial.link} target="_blank" rel="noopener noreferrer" aria-label={`View feedback from ${testimonial.name}`}>
                        <MessageSquarePlus className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-foreground/80 text-sm">&quot;{testimonial.content}&quot;</p>
        </CardContent>
    </Card>
);

export default function Testimonials() {
    // Bagi testimonial menjadi beberapa kelompok untuk tampilan marquee
    // Pastikan setiap baris memiliki cukup item untuk efek marquee yang mulus

    // Untuk desktop (3 baris)
    const row1_desktop = testimonials.slice(0, 4);
    const row2_desktop = testimonials.slice(4, 8);
    const row3_desktop = testimonials.slice(8, 11);

    return (
        <section id="testimonials" className="py-20 md:py-28 bg-muted/30 overflow-hidden">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Pengguna Kami</h2>
                    <p className="text-foreground/70 text-lg">Umpan balik nyata dari pengguna kami nantinnya.</p>
                    <Button variant="outline" className="mt-6 gap-2" asChild>
                        <Link href="https://docs.google.com/forms/d/e/1FAIpQLSd-Nv5556fHGL98gi8casPL2Mzdgqc-HmbivyqGDxPR0nqiyQ/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                            <MessageSquarePlus className="h-4 w-4" />
                            Bagikan Umpan Balik Anda
                        </Link>
                    </Button>
                </div>

                {/* Container untuk efek blur/fade */}
                <div className="relative marquee-fade-effect">
                    {/* Tampilan untuk Desktop (md ke atas): 3 baris marquee */}
                    <div className="md:block space-y-6 mask-x-from-80% mask-x-to-90%">
                        {/* Baris Desktop 1: Bergerak ke kiri, kecepatan normal */}
                        <Marquee pauseOnHover speed="normal" direction="left">
                            {row1_desktop.map((testimonial, i) => (
                                <div key={i} className="flex-shrink-0 mx-2 w-[320px]">
                                    <TestimonialCard testimonial={testimonial} />
                                </div>
                            ))}
                        </Marquee>
                        {/* Baris Desktop 2: Bergerak ke kanan, kecepatan lambat */}
                        <Marquee pauseOnHover speed="slow" direction="right" className="mt-6">
                            {row2_desktop.map((testimonial, i) => (
                                <div key={i} className="flex-shrink-0 mx-2 w-[320px]">
                                    <TestimonialCard testimonial={testimonial} />
                                </div>
                            ))}
                        </Marquee>
                        {/* Baris Desktop 3: Bergerak ke kiri, kecepatan normal */}
                        <Marquee pauseOnHover speed="normal" direction="left" className="mt-6">
                            {row3_desktop.map((testimonial, i) => (
                                <div key={i} className="flex-shrink-0 mx-2 w-[320px]">
                                    <TestimonialCard testimonial={testimonial} />
                                </div>
                            ))}
                        </Marquee>
                    </div>
                </div>
            </div>
        </section>
    );
}