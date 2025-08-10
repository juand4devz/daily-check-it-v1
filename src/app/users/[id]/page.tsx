// /users/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { UserProfileContent } from "@/components/user/UserProfileContent";
import { AlertTriangle } from "lucide-react";

export default function UserProfilePageWrapper() {
    const { id: userId } = useParams();

    if (typeof userId !== 'string') {
        return (
            <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
                <h1 className="text-3xl font-bold">ID Pengguna Tidak Valid</h1>
                <p className="text-muted-foreground mt-2">Mohon periksa kembali URL Anda.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <UserProfileContent userId={userId} />
        </div>
    );
}