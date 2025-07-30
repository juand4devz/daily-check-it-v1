// /lib/utils/useUserState.ts
"use client";

import { useState, useCallback } from "react";
import { EmojiReactionKey } from "@/types/forum";

export interface UserState {
    votes: { [replyId: string]: "up" | "down" | null };
    postLikes: { [postId: string]: boolean };
    reactions: { [replyId: string]: EmojiReactionKey | null };
    bookmarks: string[];
}

const getStoredUserState = (): UserState => {
    if (typeof window === "undefined") {
        return { votes: {}, postLikes: {}, reactions: {}, bookmarks: [] };
    }
    try {
        const stored = localStorage.getItem("forum-user-state");
        const parsed = stored ? JSON.parse(stored) : {};

        const normalizedReactions: { [replyId: string]: EmojiReactionKey | null } = {};
        for (const replyId in parsed.reactions) {
            if (Array.isArray(parsed.reactions[replyId]) && parsed.reactions[replyId].length > 0) {
                normalizedReactions[replyId] = parsed.reactions[replyId][0] as EmojiReactionKey;
            } else if (typeof parsed.reactions[replyId] === 'string') {
                normalizedReactions[replyId] = parsed.reactions[replyId] as EmojiReactionKey;
            } else {
                normalizedReactions[replyId] = null;
            }
        }

        return {
            votes: parsed.votes || {},
            postLikes: parsed.postLikes || {},
            reactions: normalizedReactions,
            bookmarks: parsed.bookmarks || [],
        };
    } catch (e) {
        console.error("Failed to parse stored user state, resetting:", e);
        return { votes: {}, postLikes: {}, reactions: {}, bookmarks: [] };
    }
};

const saveUserState = (state: UserState) => {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem("forum-user-state", JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save user state:", error);
        }
    }
};

export function useUserState() {
    const [userState, setUserState] = useState<UserState>(getStoredUserState);

    const updateUserState = useCallback((updater: Partial<UserState> | ((prevState: UserState) => UserState)) => {
        setUserState((prev) => {
            let newState: UserState;
            if (typeof updater === 'function') {
                newState = updater(prev);
            } else {
                newState = { ...prev, ...updater };
            }
            saveUserState(newState);
            return newState;
        });
    }, []);

    return { userState, updateUserState };
}