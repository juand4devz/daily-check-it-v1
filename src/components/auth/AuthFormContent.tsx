// components/auth/AuthFormContent.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { AuthButton } from "./auth-button";
import { signIn } from "next-auth/react";

type AuthFormContentProps = {
    type: "login" | "register";
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    onToggleType: () => void;
    onClose: () => void;
};

export function AuthFormContent({
    type,
    onSuccess,
    onError,
    onToggleType,
    onClose,
}: AuthFormContentProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const username =
            (form.elements.namedItem("username") as HTMLInputElement)?.value || "";
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement)
            .value;

        try {
            if (type === "register") {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ username, email, password }),
                    headers: { "Content-Type": "application/json" },
                });

                if (res.ok) {
                    onSuccess("Berhasil mendaftar! Silakan login untuk melanjutkan.");
                    form.reset();
                } else {
                    const data = await res.json();
                    onError(data?.message ?? "Registrasi gagal. Silakan coba kembali.");
                }
            } else {
                const res = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                });

                if (res && !res.error) {
                    onSuccess("Login berhasil! Selamat datang kembali 👋");
                    form.reset();
                    onClose();
                } else {
                    onError("Email atau password salah.");
                }
            }
        } catch (err) {
            console.error(err);
            onError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Hapus wrapper div dan props, karena sudah diatasi di AuthDialog
        <Card className="w-full backdrop-blur-xs bg-card/30 dark:backdrop-blur-xs dark:bg-transparent rounded-lg border-none shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-2xl">
                    {type === "login" ? "Login" : "Register"}
                </CardTitle>
                <CardDescription>
                    {type === "login"
                        ? "Masukkan email dan password untuk masuk."
                        : "Buat akun baru untuk mulai menggunakan aplikasi."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <AuthButton type="google" />
                    <AuthButton type="github" />
                    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                        <span className="backdrop-blur-3xl bg-transparent/25 text-muted-foreground relative z-10 px-2">
                            Atau lanjutkan dengan
                        </span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
                    {type === "register" && (
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Contoh: jhon"
                                required
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@gmail.com"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <Button disabled={isLoading} type="submit" className="w-full">
                        {isLoading ? "Memproses..." : type === "login" ? "Login" : "Daftar"}
                    </Button>
                    <div className="mt-3 text-center text-sm">
                        {type === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
                        <button
                            type="button"
                            onClick={onToggleType}
                            className="underline underline-offset-4"
                        >
                            {type === "login" ? "Daftar" : "Login"}
                        </button>
                    </div>
                </form>
            </CardContent>
            <span className="text-card-foreground text-xs text-center max-w-64 self-center-safe">
                Dengan mengklik lanjutkan, Anda menyetujui Persyaratan Layanan dan Kebijakan kami.
            </span>
        </Card>
    );
}