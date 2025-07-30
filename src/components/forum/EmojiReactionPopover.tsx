// /components/forum/EmojiReactionPopover.tsx
"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { EMOJI_REACTIONS } from "@/types/forum"; // Pastikan import ini benar
import { cn } from "@/lib/utils";

interface EmojiReactionPopoverProps {
    // PERUBAHAN: currentUserReactions sekarang adalah array string (atau kosong jika tidak ada)
    // Ini karena onSelect di ReplyItem mengirimkan array, meskipun userState.reactions adalah string | null
    // onSelect akan menerima reactionKey yang dipilih dan apakah user sudah mereaksi itu sebelumnya
    onSelect: (reactionKey: string) => void;
    // currentUserReactions yang datang dari ReplyItem adalah string[] (dari filter/map)
    currentUserReactions: string[]; // Ini adalah array dari reaction key yang diberikan user saat ini
    replyReactions: { [key: string]: string[] }; // Ini adalah semua reaksi pada komentar
    disabled?: boolean;
}

export function EmojiReactionPopover({ onSelect, currentUserReactions, replyReactions, disabled }: EmojiReactionPopoverProps) {
    // Menentukan reaksi yang aktif oleh user saat ini
    const activeReactionKey = currentUserReactions.length > 0 ? currentUserReactions[0] : null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-6 px-2 text-xs flex items-center gap-1",
                        activeReactionKey ? "bg-blue-100 text-blue-600 border-blue-200" : ""
                    )}
                    disabled={disabled}
                >
                    {activeReactionKey ? EMOJI_REACTIONS.find(e => e.key === activeReactionKey)?.emoji : <Smile className="h-3 w-3" />}
                    <span className="ml-1">Reaksi</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 flex flex-wrap gap-1">
                {EMOJI_REACTIONS.map((reaction) => {
                    // Memeriksa apakah reaksi ini adalah reaksi aktif dari pengguna saat ini
                    const isSelected = activeReactionKey === reaction.key;
                    const count = replyReactions[reaction.key]?.length || 0; // Jumlah total reaksi untuk emoji ini

                    return (
                        <Button
                            key={reaction.key}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-9 w-9 text-lg rounded-full flex items-center justify-center",
                                isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-200 dark:hover:bg-gray-700"
                            )}
                            onClick={() => onSelect(reaction.key)}
                            disabled={disabled}
                        >
                            {reaction.emoji}
                            {count > 0 && (
                                <span className={cn(
                                    "absolute -bottom-1 -right-1 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center",
                                    isSelected ? "bg-white text-blue-600" : "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                )}>
                                    {count}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}