import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookmarksSkeleton() {
    return (
        <div className="px-4 py-8 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
                    <div>
                        <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
                        <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 text-center">
                            <Skeleton className="h-8 w-12 bg-gray-200 dark:bg-zinc-800 rounded mx-auto mb-1" />
                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded mx-auto" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <Skeleton className="flex-1 h-10 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-10 w-10 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        <Skeleton className="h-10 w-10 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-zinc-800 rounded" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden p-0">
                                <Skeleton className="h-48 bg-gray-200 dark:bg-zinc-800" />
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded mb-1" />
                                            <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
                                    <div className="space-y-2 mb-3">
                                        <Skeleton className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded" />
                                        <Skeleton className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <Skeleton className="h-5 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        <Skeleton className="h-5 w-12 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t">
                                        <div className="flex gap-4">
                                            <Skeleton className="h-4 w-12 bg-gray-200 dark:bg-zinc-800 rounded" />
                                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        </div>
                                        <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        <Skeleton className="h-5 w-8 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}