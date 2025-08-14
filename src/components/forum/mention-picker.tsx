"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name: string
  avatar: string
}

interface MentionPickerProps {
  users: User[]
  query: string
  onSelect: (user: User) => void
  className?: string
}

export function MentionPicker({ users, onSelect, className = "" }: MentionPickerProps) {
  if (users.length === 0) return null

  return (
    <div className={`absolute bg-white border rounded-lg shadow-lg py-2 z-50 max-h-48 overflow-y-auto ${className}`}>
      {users.map((user) => (
        <Button
          key={user.id}
          variant="ghost"
          className="w-full justify-start px-3 py-2 h-auto"
          onClick={() => onSelect(user)}
        >
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={user.avatar || ""} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{user.name}</span>
        </Button>
      ))}
    </div>
  )
}
