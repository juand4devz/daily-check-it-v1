import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*", // Ini menargetkan semua bot (Google, Bing, dll.)
            allow: "/", // Izinkan bot untuk mengindeks semua halaman
            disallow: ["/private/"], // Contoh: blokir folder privat
        },
        sitemap: "https://daily-cekit.vercel.app/sitemap.xml", // Arahkan ke sitemap Anda
    };
}