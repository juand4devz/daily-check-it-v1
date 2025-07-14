// /types/forum.ts
import { LucideIcon } from "lucide-react";
import {
    Monitor,
    Cpu,
    Wifi,
    Gamepad2,
    Stethoscope,
    HelpCircle,
} from "lucide-react";

export interface ForumPost {
    id: string;
    title: string;
    content: string;
    author: string;
    avatar: string;
    category: string;
    timestamp: string;
    likes: number;
    replies: number;
    tags: string[];
    isResolved: boolean;
    media?: Array<{ type: string; url: string }>;
}

export type CategoryType =
    | "Hardware"
    | "Software"
    | "Network"
    | "Gaming"
    | "Diagnosa"
    | "Lainnya"
    | "all";

export const categoryIcons: Record<CategoryType, LucideIcon> = {
    Hardware: Monitor,
    Software: Cpu,
    Network: Wifi,
    Gaming: Gamepad2,
    Diagnosa: Stethoscope,
    Lainnya: HelpCircle,
    all: HelpCircle, // Default icon for 'all' or fallback
};

export const gradientClasses = [
    "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
    "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",
    "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",
    "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
];

export interface CategoryStat {
    value: string;
    label: string;
    count: number;
}