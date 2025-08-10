"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { AuthFormContent } from "./AuthFormContent";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type AuthDialogProps = {
    initialType: "login" | "register";
};

export function AuthDialog({ initialType }: AuthDialogProps) {
    const [open, setOpen] = useState(false);
    const [authType, setAuthType] = useState<"login" | "register">(initialType);
    const router = useRouter();
    const pathname = usePathname(); // Dapatkan pathname saat ini

    const handleToggleType = () => {
        setAuthType(authType === "login" ? "register" : "login");
    };

    const handleSuccess = (message: string) => {
        toast.success(message);
        if (authType === "register") {
            setAuthType("login");
        }
    };

    const handleError = (message: string) => {
        toast.error(message);
    };

    const handleClose = () => {
        setOpen(false);
        // Setelah login berhasil via dialog, navigasi ke halaman saat ini
        router.push(pathname);
        // Anda bisa juga hanya memanggil router.refresh() jika ingin me-reload data tanpa mengubah URL
        // router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    {authType === "login" ? "Login" : "Daftar"}
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-md">
                <VisuallyHidden asChild>
                    <DialogTitle>Formulir Otentikasi</DialogTitle>
                </VisuallyHidden>
                <AuthFormContent
                    type={authType}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onToggleType={handleToggleType}
                    onClose={handleClose}
                />
            </DialogContent>
        </Dialog>
    );
}