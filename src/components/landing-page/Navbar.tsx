"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import JustLogo from "../logo/JustLogo";
import DailyCekItLogo from "../logo/DailyCek";
import { ThemeToggle } from "../theme-toggle";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; // Import komponen Skeleton

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Ambil status dan router
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Fitur", href: "#features" },
        { name: "Manfaat", href: "#benefits" },
        { name: "Testimoni", href: "#testimonials" },
        { name: "Dukungan", href: "#support" },
    ];

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // Fungsi untuk mengarahkan pengguna
    const handleAuthAction = () => {
        if (status === "authenticated") {
            router.push("/forum-feed");
        } else {
            signIn();
        }
    };

    // Komponen dinamis untuk tombol login/forum
    const AuthButton = () => {
        if (status === "loading") {
            return <Skeleton className="h-10 w-24 rounded-md" />;
        }

        if (status === "authenticated") {
            return (
                <Button type="button" onClick={handleAuthAction}>
                    Masuk ke Forum
                </Button>
            );
        }

        return (
            <Button type="button" onClick={handleAuthAction}>
                Login
            </Button>
        );
    };

    return (
        <header
            className={cn(
                "fixed z-50 transition-all duration-300 w-full top-0 left-0",
                "bg-background/95 backdrop-blur-md shadow-sm", // Default untuk mobile (selalu ada background)
                "md:bg-transparent md:shadow-none", // Aturan default untuk desktop (transparan)
                scrolled && "md:bg-background/95 md:backdrop-blur-md md:shadow-sm" // Aturan untuk desktop saat di-scroll
            )}
        >
            <div className="container mx-auto px-4 py-2">
                <div className="flex w-full items-center justify-between">
                    {/* Logo & Nama Aplikasi */}
                    <Link href="/" className="flex gap-2 items-center">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <JustLogo className="" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none">
                            <DailyCekItLogo className="max-h-8" />
                        </div>
                    </Link>

                    {/* Kontainer Utama Navigasi & Aksi */}
                    <div className="flex items-center gap-2">
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm font-medium transition-colors hover:text-primary text-foreground/70"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <AuthButton />
                        </nav>

                        {/* Tombol Mode & Toggle Menu untuk Seluler */}
                        <div className="flex items-center md:hidden">
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleMobileMenu}
                                aria-label="Toggle mobile menu"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>

                        {/* Tombol Mode Desktop */}
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-in-out overflow-hidden md:hidden",
                        mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                    )}
                >
                    <nav className="flex flex-col items-center py-4 space-y-4 border-t mt-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-foreground/70 hover:text-primary transition-colors"
                                onClick={toggleMobileMenu}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="w-full max-w-xs mt-4">
                            <AuthButton />
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}