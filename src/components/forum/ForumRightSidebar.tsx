// components/ForumRightSidebar.tsx
"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { CategoryStat } from "@/types/forum";
import { getCategoryIcon } from "@/lib/utils/forum";
import { useRouter } from "next/navigation";

interface ForumRightSidebarProps {
    categoryStats: CategoryStat[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    setSearchQuery: (query: string) => void; // Added for popular tags
}

const ForumRightSidebar: FC<ForumRightSidebarProps> = ({
    categoryStats,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
}) => {
    const router = useRouter();

    return (
        <div className="lg:col-span-1 space-y-6">
            {/* Create New Post Button (Desktop only) */}
            <Button
                onClick={() => router.push("/forum/new")}
                className="shrink-0 w-full hidden md:flex"
            >
                <Plus className="mr-2 h-4 w-4" />
                Buat Pertanyaan
            </Button>

            {/* Categories Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Kategori</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {categoryStats.map((category) => {
                        const IconComponent = getCategoryIcon(
                            category.value === "all" ? "Lainnya" : category.value
                        );
                        return (
                            <Button
                                size="icon"
                                key={category.value}
                                onClick={() => setSelectedCategory(category.value)}
                                className={`w-full text-left p-3 flex justify-between rounded-lg transition-all duration-200 ${selectedCategory === category.value
                                    ? "bg-blue-100 text-gray-800 shadow-sm hover:bg-gray-200"
                                    : "hover:bg-gray-200 bg-background dark:bg-background/80 dark:text-gray-200 text-gray-500"
                                    }`}
                            >
                                <div className="flex items-cente w-full justify-between">
                                    <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {category.label}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {category.count}
                                    </Badge>
                                </div>
                            </Button>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tag Populer</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "diagnosa",
                            "hardware",
                            "windows",
                            "gaming",
                            "laptop",
                            "ssd",
                            "ram",
                            "network",
                            "software",
                        ].map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors hover:text-gray-900"
                                onClick={() => setSearchQuery(tag)}
                            >
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForumRightSidebar;