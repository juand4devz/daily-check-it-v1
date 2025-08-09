"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import Marquee from "@/components/ui/marquee"; // Import komponen Marquee yang baru dibuat

const testimonials = [
    {
        name: "Sarah J.",
        content: "DailyCek.It telah mengubah cara kami menangani dukungan teknis. Diagnosa AI menghemat banyak waktu dan basis pengetahuannya adalah tambang emas.",
        avatar: "SJ",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "David C.",
        content: "Sebagai seseorang yang tidak terlalu paham teknologi, platform ini sangat membantu. Diagnosa langkah-demi-langkah membantu saya memperbaiki laptop saya.",
        avatar: "DC",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Aisha R.",
        content: "Saya mendapatkan solusi untuk masalah teknis yang kompleks di DailyCek.It. Basis pengetahuannya adalah sumber daya yang luar biasa untuk setiap masalah.",
        avatar: "AR",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Budi S.",
        content: "Aplikasi yang sangat membantu untuk mendiagnosa masalah laptop saya. Terima kasih DailyCek.It!",
        avatar: "BS",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Dewi A.",
        content: "Akhirnya ada platform yang bisa membantu saya memahami masalah teknis tanpa harus ke teknisi. Sangat direkomendasikan!",
        avatar: "DA",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Ahmad F.",
        content: "Fitur diagnosa mandiri sangat berguna. Berhasil memperbaiki masalah koneksi WiFi saya dalam waktu 10 menit saja.",
        avatar: "AF",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Citra K.",
        content: "Sangat mudah digunakan dan informatif. Saya tidak perlu lagi panik setiap kali ada masalah dengan perangkat saya.",
        avatar: "CK",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Eko P.",
        content: "Dukungan AI-nya brilian! Ini seperti memiliki teknisi pribadi yang selalu siap membantu 24/7.",
        avatar: "EP",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Fitri G.",
        content: "Saya suka bagaimana DailyCek.It memberikan panduan yang jelas. Saya belajar banyak dari solusi yang tersedia.",
        avatar: "FG",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Hadi W.",
        content: "Desain responsifnya luar biasa. Saya bisa mengakses semua fitur dengan mudah dari ponsel saya.",
        avatar: "HW",
        link: "https://forms.gle/your-form-link"
    },
    {
        name: "Indah L.",
        content: "Basis pengetahuannya sangat lengkap. Saya selalu menemukan jawaban untuk pertanyaan teknis saya di sini.",
        avatar: "IL",
        link: "https://forms.gle/your-form-link"
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
                        <Link href="https://forms.gle/your-form-link" target="_blank" rel="noopener noreferrer">
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