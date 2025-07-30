// /users/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { UserProfileContent } from "@/components/user/UserProfileContent"; // Import the reusable component

export default function UserProfilePageWrapper() {
    const { id: userId } = useParams(); // Get userId from URL params

    if (typeof userId !== 'string') {
        // Handle invalid userId param, e.g., redirect or show error
        return <div className="container mx-auto px-4 py-8 text-center text-red-500">ID pengguna tidak valid.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <UserProfileContent userId={userId} /> {/* Pass userId to content component */}
        </div>
    );
}