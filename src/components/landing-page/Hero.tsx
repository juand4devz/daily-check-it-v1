"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

// Komponen VideoModal yang diperbarui untuk menggunakan URL YouTube
function VideoModal({ isOpen, onClose, title, videoId }: { isOpen: boolean; onClose: () => void; videoId: string; title: string; }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle className="hidden" />
            <DialogContent className={cn("max-w-2xl md:max-w-4xl p-0 border-0 bg-transparent shadow-none")}>
                <div className="aspect-video w-full">
                    {/* Menggunakan elemen iframe untuk memutar video dari YouTube */}
                    <iframe
                        className="w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Komponen Hero yang memanggil VideoModal
export default function Hero() {
    const [showVideo, setShowVideo] = useState(false);
    const youtubeVideoId = "hNMkpr4idb4"; // Menggunakan ID video dari URL yang Anda berikan

    return (
        <section id="hero" className="relative pt-32 pb-20 md:pt-32 md:pb-28 overflow-hidden">
            <div className="container relative z-10 text-center flex flex-col items-center">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                        <span className="block">Solusi Teknologi</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400">
                            Terpadu untuk Anda
                        </span>
                    </h1>
                    <p className="mt-6 text-foreground/70 text-lg md:text-xl max-w-xl mx-auto">
                        Diagnosis masalah teknologi Anda, temukan solusi efektif, dan akses basis pengetahuan luas untuk semua kebutuhan teknis Anda di DailyCek.It.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="gap-2 text-md" asChild>
                            <Link href="/forum-feed">
                                Mulai Gratis <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="gap-2 text-md" onClick={() => setShowVideo(true)}>
                            Lihat Demo <Play className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="relative w-full max-w-5xl mt-20">
                    <div
                        className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/20 cursor-pointer group"
                        onClick={() => setShowVideo(true)}
                    >
                        <Image
                            src="/forum-feed.png"
                            alt="Tampilan platform DailyCek.It"
                            width={1600}
                            height={900}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <Play className="h-8 w-8 text-white fill-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <VideoModal
                isOpen={showVideo}
                onClose={() => setShowVideo(false)}
                videoId={youtubeVideoId}
                title="DailyCek.It Demo"
            />
        </section>
    );
}
