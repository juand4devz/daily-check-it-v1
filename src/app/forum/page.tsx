import { Suspense } from "react";
import { ForumClient } from "@/components/forum/ForumClient";
import { ForumListSkeleton } from "@/components/ui/skeleton-loader";

export default function ForumPage() {
    return (
        <Suspense fallback={<ForumListSkeleton />}>
            <ForumClient />
        </Suspense>
    );
}