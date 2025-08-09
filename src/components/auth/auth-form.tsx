"use client";

import { cn } from "@/lib/utils";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthButton } from "./auth-button";
import { signIn } from "next-auth/react";

type AuthFormProps = React.ComponentPropsWithoutRef<"div"> & {
    type: "login" | "register";
    className?: string;
};

export function AuthForm({ className, type, ...props }: AuthFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const callbackUrl = "/forum-feed"; // ganti sesuai kebutuhanmu

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            if (type === "register") {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ name, email, password }),
                });

                if (res.ok) {
                    toast.success("Berhasil mendaftar!", {
                        description: "Silakan login untuk mulai menggunakan aplikasi.",
                    });
                    form.reset();
                    router.push("/login");
                } else {
                    const data = await res.json();
                    toast.error(data?.message ?? "Registrasi gagal.", {
                        description: "Silahkan coba kembali",
                    });
                }
            } else {
                const res = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                    callbackUrl,
                });

                if (res && !res.error) {
                    toast.success("Login berhasil!", {
                        description: "Selamat datang kembali 👋",
                    });
                    form.reset();
                    router.push(callbackUrl);
                } else {
                    toast.error("Email atau password salah.");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("", className)} {...props}>
            {/* Penyesuaian di sini: Mengurangi padding pada Card */}
            <Card className="max-w-sm backdrop-blur-xs bg-card/30 dark:backdrop-blur-xs dark:bg-transparent">
                <CardHeader className="pb-3"> {/* Mengurangi padding bawah */}
                    <CardTitle className="text-2xl">
                        {type === "login" ? "Login" : "Register"}
                    </CardTitle>
                    <CardDescription>
                        {type === "login"
                            ? "Masukkan email dan password untuk masuk."
                            : "Buat akun baru untuk mulai menggunakan aplikasi."}
                    </CardDescription>
                </CardHeader>
                <CardContent> {/* Mengurangi padding atas */}
                    <div className="flex flex-col gap-3"> {/* Mengurangi gap */}
                        <AuthButton type="google" />
                        <AuthButton type="github" />
                        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                            <span className="backdrop-blur-3xl bg-transparent/25 text-muted-foreground relative z-10 px-2">
                                Atau lanjutkan dengan
                            </span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3"> {/* Mengurangi margin-top dan gap */}
                        {type === "register" && (
                            <div className="grid gap-2">
                                <Label htmlFor="name">Fullname</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Contoh: Juanda"
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
                        <div className="mt-3 text-center text-sm"> {/* Mengurangi margin-top */}
                            {type === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
                            <a
                                href={type === "login" ? "/register" : "/login"}
                                className="underline underline-offset-4"
                            >
                                {type === "login" ? "Daftar" : "Login"}
                            </a>
                        </div>
                    </form>
                </CardContent>
                <span className="text-card-foreground text-xs text-center max-w-64 self-center-safe">
                    Dengan mengklik lanjutkan, Anda menyetujui Persyaratan Layanan dan Kebijakan kami.
                </span>
            </Card>
        </div>
    );
}