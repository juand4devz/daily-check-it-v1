// app/not-found.tsx atau pages/404.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="flex w-full flex-col items-center justify-center space-y-4">
                {/* Menggunakan komponen Image dari Next.js untuk optimasi gambar */}
                <div className="relative h-44 w-96 max-w-full">
                    {/* Pastikan path gambar sesuai dengan lokasi penyimpanan Anda */}
                    <Image
                        src="/responses/404_z4xiwg.png"
                        alt="Halaman tidak ditemukan"
                        layout="fill"
                        objectFit="contain"
                        className="select-none"
                    />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    404 - Halaman Tidak Ditemukan
                </h1>
                <p className="text-lg text-muted-foreground">
                    Maaf, sepertinya halaman yang Anda cari tidak ada.
                </p>
                <Link href="/forum-feed" passHref>
                    <Button className="mt-4 cursor-pointer">Kembali ke Beranda</Button>
                </Link>
            </div>
        </div>
    );
}