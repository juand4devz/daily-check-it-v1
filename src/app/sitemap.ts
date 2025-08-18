import type { MetadataRoute } from 'next';

/**
 * Fungsi untuk menghasilkan sitemap untuk aplikasi Next.js.
 * Sitemap ini membantu mesin pencari mengindeks halaman situs dengan lebih efisien.
 *
 * @returns {MetadataRoute.Sitemap} Daftar URL dengan prioritas dan frekuensi perubahan.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    // URL utama dari aplikasi Anda
    const baseUrl = "https://daily-cekit.vercel.app";

    return [
        // Halaman utama (beranda) dengan prioritas tertinggi
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
        // Halaman login dan register, penting untuk fungsionalitas aplikasi
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.9,
        },
        // Halaman utama forum, penting untuk konten yang sering diperbarui
        {
            url: `${baseUrl}/forum`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        // Halaman feed forum
        {
            url: `${baseUrl}/forum-feed`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.7,
        },
        // Halaman diagnosa dan bantuan AI, inti dari aplikasi
        {
            url: `${baseUrl}/diagnose`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/ai-assistance`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
    ];
}
