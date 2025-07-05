// utils.ts
import { parseISO, format, formatDistanceToNowStrict } from "date-fns";
import { id } from "date-fns/locale";
import { categoryIcons, gradientClasses, CategoryType } from "@/types/forum";
import { HelpCircle, LucideIcon } from "lucide-react";

export const getTimeAgo = (timestamp: string): string => {
    const postDate = parseISO(timestamp);
    const now = new Date();

    if (format(postDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
        return formatDistanceToNowStrict(postDate, { addSuffix: true, locale: id });
    }

    return format(postDate, "dd MMMM yyyy", { locale: id });
};

export const getCategoryIcon = (category: string): LucideIcon => {
    const IconComponent = categoryIcons[category as CategoryType] || HelpCircle;
    return IconComponent;
};

export const getRandomGradient = (id: string): string => {
    const stringId = String(id);
    const index = Number.parseInt(stringId, 36) % gradientClasses.length;
    return gradientClasses[index];
};