// components/ui/guest-home-skeleton.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Pastikan Anda memiliki komponen Skeleton dari shadcn/ui

export function GuestHomeSkeleton() {
    return (
        <div className="px-4 py-8 w-full">
            {/* Mini Hero Section Skeleton */}
            <div className="text-center mb-12">
                <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
                <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
                <div className="flex justify-center gap-4">
                    <Skeleton className="h-10 w-40 rounded-md" />
                    <Skeleton className="h-10 w-40 rounded-md" />
                </div>
            </div>

            {/* Section Title Skeleton */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-7 w-60" />
                <Skeleton className="h-7 w-40 rounded-md" />
            </div>

            {/* Posts Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => ( // Show 8 skeleton cards
                    <Card key={i} className="py-0 overflow-hidden">
                        <Skeleton className="h-48 w-full rounded-b-none" />
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-md" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-3" />
                            <Skeleton className="h-4 w-5/6 mb-3" />
                            <div className="flex flex-wrap gap-1 mb-4">
                                <Skeleton className="h-5 w-12 rounded-md" />
                                <Skeleton className="h-5 w-12 rounded-md" />
                                <Skeleton className="h-5 w-12 rounded-md" />
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}