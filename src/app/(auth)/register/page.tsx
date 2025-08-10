"use client"

import { AuthFormContent } from "@/components/auth/AuthFormContent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const handleSuccess = (message: string) => {
        toast.success(message);
        router.push("/login"); // Pindah ke halaman login setelah register berhasil
    };

    const handleError = (message: string) => {
        toast.error(message);
    };

    const handleToggleType = () => {
        router.push("/login"); // Pindah ke halaman login
    };

    const handleClose = () => {
        // Tidak ada tindakan khusus karena ini bukan dialog
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <AuthFormContent
                type="register"
                onSuccess={handleSuccess}
                onError={handleError}
                onToggleType={handleToggleType}
                onClose={handleClose}
            />
        </div>
    );
}