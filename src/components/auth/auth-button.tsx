"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signIn, signOut } from "next-auth/react";
import { Github, LogOut } from "lucide-react";

type AuthButtonProps = {
    type: "google" | "github";
};

export function AuthButton({ type }: AuthButtonProps) {
    const handleSocialLogin = async () => {
        try {
            const res = await signIn(type, {
                redirect: false,
                callbackUrl: "/",
            });

            if (!res?.error) {
                toast.success("Login berhasil!", {
                    description: `Selamat datang kembali dengan ${type.charAt(0).toUpperCase() + type.slice(1)} 🎉`,
                });
                window.location.href = res?.url ?? "/";
            } else {
                toast.error("Login gagal", {
                    description: "Terjadi kesalahan saat login sosial.",
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Terjadi error saat login", {
                description: "Silakan coba beberapa saat lagi.",
            });
        }
    };

    const Icon = type === "google" ? GoogleIcon : GithubIcon;
    const label = `Login with ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    return (
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleSocialLogin}>
            <Icon />
            {label}
        </Button>
    );
}

export function SignOut() {
    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Berhasil keluar", {
                description: "Sampai jumpa lagi 👋",
            });
        } catch (err) {
            console.error(err);
            toast.error("Gagal keluar", {
                description: "Terjadi kesalahan saat logout.",
            });
        }
    };

    return (
        <Button variant="destructive" size="sm" className="w-full flex items-center gap-2" onClick={handleSignOut}>
            <LogOut size={16} />
            Keluar
        </Button>
    );
}

// ✅ SVG Icons — bisa dipisah ke file terpisah kalau perlu
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" >
            <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
            />
        </svg >
    );
}

function GithubIcon() {
    return (
        <Github />
    );
}
