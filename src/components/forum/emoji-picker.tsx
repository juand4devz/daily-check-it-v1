"use client"
import { Button } from "@/components/ui/button"

interface EmojiReaction {
  emoji: string
  label: string
  key: string
}

interface EmojiPickerProps {
  reactions: EmojiReaction[]
  onSelect: (key: string) => void
  className?: string
}

export function EmojiPicker({ reactions, onSelect, className = "" }: EmojiPickerProps) {
  return (
    <div className={`absolute bg-white border rounded-lg shadow-lg p-2 z-50 ${className}`}>
      <div className="flex gap-1">
        {reactions.map((reaction) => (
          <Button
            key={reaction.key}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 text-lg"
            onClick={() => onSelect(reaction.key)}
            title={reaction.label}
          >
            {reaction.emoji}
          </Button>
        ))}
      </div>
    </div>
  )
}
