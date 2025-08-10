"use client";

import { AuthFormContent } from "@/components/auth/AuthFormContent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const handleSuccess = (message: string) => {
        toast.success(message);
        router.push("/forum-feed");
    };

    const handleError = (message: string) => {
        toast.error(message);
    };

    const handleToggleType = () => {
        router.push("/register");
    };

    const handleClose = () => { };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <AuthFormContent
                type="login"
                onSuccess={handleSuccess}
                onError={handleError}
                onToggleType={handleToggleType}
                onClose={handleClose}
            />
        </div>
    );
}