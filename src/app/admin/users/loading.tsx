// /components/ui/skeleton-loader.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function UserPageSkeleton() {
    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-md" />
                    <Skeleton className="h-4 w-96 rounded-md" />
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Skeleton className="h-10 w-full md:w-28" />
                <Skeleton className="h-10 w-full md:w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-[400px] w-full rounded-md" />
                <Skeleton className="h-[400px] w-full rounded-md" />
            </div>
            <div className="space-y-4 mt-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
                <Skeleton className="h-8 w-full mt-4" />
            </div>
        </div>
    );
}

export function GejalaPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between mb-6 space-y-4 md:space-y-0">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-md" />
                        <Skeleton className="h-4 w-96 rounded-md" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-28 rounded-md" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                    <Skeleton className="h-[300px] w-full rounded-md" />
                </div>
                <Skeleton className="h-[60vh] w-full rounded-md" />
            </div>
        </div>
    );
}

export function KerusakanPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between mb-6 space-y-4 md:space-y-0">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-md" />
                        <Skeleton className="h-4 w-96 rounded-md" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-28 rounded-md" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                    <Skeleton className="h-[300px] w-full rounded-md" />
                </div>
                <Skeleton className="h-[60vh] w-full rounded-md" />
            </div>
        </div>
    );
}