// app/banned/page.tsx
import Link from "next/link";
import { AlertTriangle, Home, Mail } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function BannedPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-lg animate-fade-in-up">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive">
                        Akses Akun Terbatas
                    </CardTitle>
                    <CardDescription>
                        Mohon maaf, akun Anda dibatasi karena dugaan pelanggaran kebijakan.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="py-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="text-lg font-semibold">Peringatan Penting</AlertTitle>
                        <AlertDescription className="mt-2 text-sm leading-relaxed">
                            Kami telah mendeteksi aktivitas yang melanggar ketentuan layanan kami.
                            Untuk informasi lebih lanjut tentang pelanggaran ini, silakan hubungi tim dukungan.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Kami akan meninjau kasus Anda secepatnya setelah Anda menghubungi kami.
                        </p>
                    </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex flex-col gap-4 p-6 sm:flex-row sm:justify-between sm:items-center">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Kembali ke Beranda
                        </Link>
                    </Button>
                    <Button asChild variant="destructive" className="w-full sm:w-auto">
                        <Link href="/contact-support">
                            <Mail className="mr-2 h-4 w-4" /> Hubungi Dukungan
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}