"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signIn, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

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
        <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
            />
        </svg>
    );
}

function GithubIcon() {
    return (
        <svg viewBox="0 0 32 32" className="w-5 h-5 dark:invert">
            <path d="M16 4C9.371 4 4 9.371 4 16c0 5.301 3.438 9.801 8.207 11.387.601.11.82-.257.82-.577 0-.285-.012-1.039-.016-2.039-3.34.723-4.043-1.609-4.043-1.609-.547-1.387-1.332-1.758-1.332-1.758-1.09-.742.082-.727.082-.727 1.203.086 1.836 1.234 1.836 1.234 1.07 1.836 2.808 1.305 3.492 1 .11-.777.422-1.305.762-1.606-2.664-.301-5.465-1.332-5.465-5.929 0-1.313.469-2.383 1.235-3.223-.121-.301-.535-1.524.117-3.176 0 0 1.008-.32 3.301 1.231.957-.266 1.984-.399 3.004-.402 1.02.003 2.047.136 3.004.402 2.293-1.551 3.297-1.231 3.297-1.231.657 1.652.242 2.875.121 3.176.77.84 1.235 1.91 1.235 3.223 0 4.605-2.805 5.625-5.473 5.921.433.371.82 1.105.82 2.223 0 1.605-.012 2.898-.012 3.293 0 .32.215.693.824.574C24.566 25.797 28 21.301 28 16 28 9.371 22.629 4 16 4z" />
        </svg>
    );
}
