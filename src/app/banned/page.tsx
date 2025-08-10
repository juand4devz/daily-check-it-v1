// app/banned/page.tsx
import Link from "next/link";

export default function BannedPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-red-50 px-6">
            <div className="max-w-lg w-full bg-white shadow-lg rounded-xl p-8 text-center border border-red-200">
                <h1 className="text-3xl font-bold text-red-600 mb-4">
                    Akun Anda Telah Diblokir
                </h1>
                <p className="text-gray-700 mb-6">
                    Maaf, akun Anda telah diblokir karena pelanggaran kebijakan.
                    Jika Anda yakin ini adalah kesalahan, silakan hubungi tim dukungan kami.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                    >
                        Kembali ke Beranda
                    </Link>
                    <Link
                        href="/contact-support"
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    >
                        Hubungi Dukungan
                    </Link>
                </div>
            </div>
        </main>
    );
}
