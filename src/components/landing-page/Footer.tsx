// /components/landing-page/Footer.tsx

import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "../ui/logos";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const inspirationApps = [
        {
            name: "DailyDev",
            link: "https://daily.dev/"
        },
        {
            name: "Vercel",
            link: "https://vercel.com/"
        },
        {
            name: "Stack Overflow",
            link: "https://stackoverflow.com/"
        },
        {
            name: "ChatGPT",
            link: "https://chatgpt.com/"
        },
        {
            name: "Figma",
            link: "https://www.figma.com/"
        }
    ];

    return (
        <footer className="bg-muted/30 border-t border-border px-10">
            <div className="py-12 md:py-16 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* First column - Brand */}
                    <div className="md:col-span-1">
                        <Logo />
                        <p className="text-foreground/70 text-sm mb-4">
                            DailyCek.It - Solusi terpadu Anda untuk diagnosa teknologi dan panduan perbaikan yang terukur.
                        </p>
                    </div>

                    {/* Links columns */}
                    <div>
                        <h3 className="font-semibold mb-4">Fitur</h3>
                        <div className="flex space-y-2 flex-col">
                            <Link href="#features" className="text-foreground/70 hover:text-primary text-sm">Fitur</Link>
                            <Link href="#benefits" className="text-foreground/70 hover:text-primary text-sm">Manfaat</Link>
                            <Link href="#testimonials" className="text-foreground/70 hover:text-primary text-sm">Testimoni</Link>
                            <Link href="#support" className="text-foreground/70 hover:text-primary text-sm">Dukungan</Link>
                        </div>
                    </div>

                    {/* Inspiration Apps column */}
                    <div>
                        <h3 className="font-semibold mb-4">Aplikasi Inspirasi</h3>
                        <div className="space-y-2">
                            {inspirationApps.map((app, i) => (
                                <div key={i}>
                                    <Link href={app.link} className="text-foreground/70 hover:text-primary text-sm" target="_blank" rel="noopener noreferrer">
                                        {app.name}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Kontak & Dukungan */}
                    <div>
                        <h3 className="font-semibold mb-4">Kontak & Dukungan</h3>
                        <p className="text-foreground/70 text-sm mb-4">
                            Butuh bantuan lebih lanjut? Hubungi kami langsung.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link href="mailto:juandailyprojects@gmail.com" className="text-foreground/70 hover:text-primary text-sm flex items-center gap-2">
                                <Mail className="h-4 w-4" /> juandailyprojects@gmail.com
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-foreground/60 text-sm text-center md:text-left">
                        © {currentYear} DailyCek.It. Hak Cipta Dilindungi Undang-Undang.
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 md:mt-0">
                        <Link href="#" className="text-foreground/60 hover:text-primary text-sm">
                            Kebijakan Privasi
                        </Link>
                        <Link href="#" className="text-foreground/60 hover:text-primary text-sm">
                            Syarat & Ketentuan
                        </Link>
                        <Link href="#" className="text-foreground/60 hover:text-primary text-sm">
                            Kebijakan Cookie
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}