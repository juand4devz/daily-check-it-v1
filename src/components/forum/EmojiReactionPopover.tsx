// /components/forum/EmojiReactionPopover.tsx
"use client";

import React from "react";
// Import PopoverClose langsung dari Radix UI
import { PopoverClose } from "@radix-ui/react-popover"; // <--- Perbaikan Import
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Tetap dari Shadcn UI
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { EMOJI_REACTIONS, EmojiReactionKey } from "@/types/forum";
import { cn } from "@/lib/utils";

interface EmojiReactionPopoverProps {
    onSelect: (reactionKey: EmojiReactionKey | null) => void; // Menerima null untuk un-react
    currentUserReaction: EmojiReactionKey | null; // Reaksi user saat ini (string key atau null)
    replyReactions: { [key: string]: string[] }; // Semua reaksi pada komentar (objek dengan array user IDs)
    disabled?: boolean;
}

export function EmojiReactionPopover({ onSelect, currentUserReaction, replyReactions, disabled }: EmojiReactionPopoverProps) {

    const handleEmojiClick = (reactionKey: EmojiReactionKey) => {
        // Jika emoji yang sama diklik, itu berarti pengguna ingin membatalkan reaksi
        if (currentUserReaction === reactionKey) {
            onSelect(null); // Kirim null untuk membatalkan reaksi
        } else {
            onSelect(reactionKey); // Kirim reactionKey baru
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-6 px-2 text-xs flex items-center gap-1",
                        currentUserReaction ? "bg-blue-100 text-blue-600 border-blue-200" : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                    )}
                    disabled={disabled}
                    aria-label="Pilih reaksi"
                >
                    {/* Tampilkan emoji reaksi aktif jika ada, kalau tidak tampilkan ikon Smile */}
                    {currentUserReaction ? EMOJI_REACTIONS.find(e => e.key === currentUserReaction)?.emoji : <Smile className="h-3 w-3" />}
                    <span className="ml-1">Reaksi</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 flex flex-wrap gap-1">
                {EMOJI_REACTIONS.map((reaction) => {
                    // Cek apakah emoji ini adalah reaksi aktif dari user yang sedang login
                    const isSelected = currentUserReaction === reaction.key;
                    // Hitung total pengguna yang memberikan reaksi ini
                    const count = replyReactions[reaction.key]?.length || 0;

                    return (
                        // Menggunakan PopoverClose untuk menutup popover setelah pemilihan
                        <PopoverClose asChild key={reaction.key}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 text-lg rounded-full flex items-center justify-center relative",
                                    "transition-all duration-200",
                                    isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : "hover:bg-gray-200 dark:hover:bg-gray-700",
                                    {
                                        // Efek visual tambahan jika tidak dipilih tetapi ada reaksi dari orang lain
                                        'opacity-70': !isSelected && count > 0
                                    }
                                )}
                                onClick={() => handleEmojiClick(reaction.key)}
                                disabled={disabled}
                                aria-label={`Reaksi ${reaction.label}`}
                            >
                                {reaction.emoji}
                                {count > 0 && (
                                    <span className={cn(
                                        "absolute -bottom-1 -right-1 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center",
                                        "transition-colors duration-200",
                                        isSelected ? "bg-white text-blue-600" : "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </Button>
                        </PopoverClose>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}