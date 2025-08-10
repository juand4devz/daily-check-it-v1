// /types/forum.ts

import {
    Monitor,
    Cpu,
    Wifi,
    Gamepad2,
    Stethoscope,
    HelpCircle,
    BookOpen, // Added for forum types
    UserCheck, // Added for forum types
    GraduationCap, // Added for forum types
    Newspaper, // Added for forum types
} from "lucide-react";

// Updated Media structure for ImageKit URLs
export interface ForumMedia {
    id?: string// ImageKit file ID
    type?: "image" | "video";
    filename?: string;
    size?: number;
    url?: string; // The public URL from ImageKit
    thumbnailUrl?: string; // Optional thumbnail URL for videos or larger images
}

export interface ForumPost {
    id: string; // Firestore document ID
    title: string;
    description: string;
    content: string;
    authorId: string; // Reference to User.id
    authorUsername: string; // Denormalized for display
    authorAvatar?: string; // Denormalized for display
    category: string;
    type: string;
    tags: string[];
    createdAt: string; // ISO string (timestamp from Firestore)
    updatedAt: string; // ISO string (last updated)
    likes: number; // Count
    likedBy: string[]; // Array of user IDs who liked the post
    replies: number; // Count of top-level replies
    views: number; // Count of views
    isResolved: boolean;
    solutionReplyIds?: string[]; // <-- PERUBAHAN: Array of solution reply IDs
    isPinned: boolean;
    isArchived: boolean;
    thumbnail?: string | null; // Allow null for optional thumbnail
    media?: ForumMedia[]; // Array of media files
}

export interface ForumReply {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorUsername: string;
    authorAvatar?: string;
    createdAt: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    upvotedBy: string[];
    downvotedBy: string[];
    parentId?: string | null;
    mentions?: string[] | null;
    // `reactions` tetap sebagai objek dengan array string[]
    // karena menyimpan daftar user yang bereaksi dengan emoji tertentu.
    // Logika di frontend/backend yang akan memastikan user hanya ada di satu array.
    reactions: { [key: string]: string[] };
    isSolution?: boolean;
    media?: ForumMedia[] | null;
    isEdited: boolean;
    editedAt?: string | null;
}

export type EmojiReactionKey = (typeof EMOJI_REACTIONS)[number]["key"];

export interface ForumBookmark {
    id: string; // Firestore document ID (optional, can use userId_postId)
    userId: string; // User who bookmarked
    postId: string; // Post that is bookmarked
    bookmarkedAt: string; // ISO string
    note?: string; // Optional user note for the bookmark
}

export type NotificationType =
    "forum_comment_on_post" |
    "forum_reply_to_comment" |
    "forum_like_post" |
    "forum_mention" |
    "forum_solution_marked" |
    "system" |
    "forum_comment_reaction";

export interface Notification {
    id: string; // Firestore document ID
    userId: string; // Recipient user ID
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string; // ISO string
    link?: string; // URL relative to the app (e.g., /forum/post-id#comment-id)
    actorId?: string; // ID of the user who performed the action
    actorUsername?: string; // Username of the user who performed the action
    postId?: string; // ID of the related forum post
    postTitle?: string; // Title of the related forum post
    replyId?: string; // ID of the related reply/comment
    commentContentPreview?: string; // Short preview of comment content
}


// These are examples from your existing utility, just ensuring they are here for context
// In a real app, these might come from a DB or separate config files.
export interface ForumType {
    id: string;
    name: string;
    description: string;
    icon: keyof typeof typeIcons; // Use keyof typeof to ensure type safety with icon map
    color: string;
    allowSolution: boolean;
    allowTags: boolean;
}

export interface ForumCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: keyof typeof categoryIcons; // Use keyof typeof
}

export const typeIcons = {
    "help-circle": HelpCircle,
    "book-open": BookOpen,
    "user-check": UserCheck,
    "graduation-cap": GraduationCap,
    newspaper: Newspaper,
};

export const categoryIcons = {
    hardware: Monitor,
    software: Cpu,
    network: Wifi,
    gaming: Gamepad2,
    diagnosa: Stethoscope,
    lainnya: HelpCircle,
};

export const EMOJI_REACTIONS = [
    { emoji: "👍", label: "Like", key: "like" },
    { emoji: "❤️", label: "Love", key: "love" },
    { emoji: "😂", label: "Laugh", key: "laugh" },
    { emoji: "😮", label: "Wow", key: "wow" },
    { emoji: "😢", label: "Sad", key: "sad" },
    { emoji: "😡", label: "Angry", key: "angry" },
] as const; // Use 'as const' for literal types
