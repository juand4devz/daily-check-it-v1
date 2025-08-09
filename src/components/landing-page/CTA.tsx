import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
    return (
        <section id="support" className="py-20 md:py-28">
            <div className="container">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-violet-500/10 px-6 py-16 rounded-2xl border border-border relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 w-full h-full opacity-30">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap Mengubah Pengalaman Dukungan Teknologi Anda?</h2>
                        <p className="text-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
                            Bergabunglah dengan beberapa pengguna yang telah menyederhanakan pemecahan masalah teknologi mereka dengan DailyCek.It. Mulai sekarang.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="gap-2 text-md" asChild>
                                <Link href="/register">
                                    Daftar Gratis <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="gap-2 text-md" asChild>
                                <Link href="https://forms.gle/your-form-link" target="_blank">
                                    Hubungi Kami
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}