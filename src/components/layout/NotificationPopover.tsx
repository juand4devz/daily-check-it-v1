// /components/layout/NotificationPopover.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bell, Check, MessageSquare, Settings, AtSign, ThumbsUp, Loader2 } from "lucide-react";
import { PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { clientDb } from "@/lib/firebase/firebase-client"; // Import clientDb
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

import { Notification, NotificationType } from "@/types/types"; // Import Notification & NotificationType
import { formatTimeAgo } from "@/lib/utils/date-utils";

interface NotificationPopoverProps {
    unreadCount: number; // Jumlah notifikasi belum dibaca (diteruskan dari parent Header)
    onOpenChange: (open: boolean) => void; // Untuk mengontrol popover dari parent jika perlu
}

// Fungsi untuk mendapatkan ikon notifikasi (copy dari /app/notifications/page.tsx)
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case "forum_comment_on_post":
        case "forum_reply_to_comment":
            return <MessageSquare className="h-4 w-4" />;
        case "forum_like_post":
            return <ThumbsUp className="h-4 w-4" />;
        case "forum_mention":
            return <AtSign className="h-4 w-4" />;
        case "forum_solution_marked":
            return <Check className="h-4 w-4" />;
        case "system":
            return <Settings className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

// Fungsi untuk mendapatkan warna ikon notifikasi (copy dari /app/notifications/page.tsx)
const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
        case "forum_comment_on_post":
        case "forum_reply_to_comment":
        case "forum_mention":
            return "bg-purple-500";
        case "forum_like_post":
            return "bg-pink-500";
        case "forum_solution_marked":
            return "bg-green-500";
        case "system":
            return "bg-orange-500";
        default:
            return "bg-blue-500";
    }
};

export function NotificationPopover({ unreadCount, onOpenChange }: NotificationPopoverProps) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const router = useRouter();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // --- EFFECT: Real-time Notifications Listener ---
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(
            notificationsCollectionRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            // limit(10) // Optional: Batasi jumlah notifikasi yang diambil jika ingin popover tidak terlalu panjang
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications: Notification[] = [];
            snapshot.forEach((doc) => {
                fetchedNotifications.push({ id: doc.id, ...(doc.data() as Omit<Notification, 'id'>) });
            });
            setNotifications(fetchedNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to notifications in popover:", error);
            toast.error("Error notifikasi", { description: "Gagal memuat notifikasi." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const displayNotifications = useMemo(() => {
        // Tampilkan 5 notifikasi belum dibaca terbaru, sisanya bisa dari notifikasi yang sudah dibaca
        const unread = notifications.filter(n => !n.read);
        const read = notifications.filter(n => n.read);
        return [...unread.slice(0, 5), ...read.slice(0, 5 - unread.length)].slice(0, 5); // Max 5 notifikasi
    }, [notifications]);

    const markAsRead = useCallback(async (id: string) => {
        if (!userId) return;
        try {
            await fetch(`/api/forum/notifications/${id}`, { method: "PATCH" });
            // State akan otomatis diupdate oleh listener
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Gagal menandai dibaca.");
        }
    }, [userId]);

    const handleNotificationClick = useCallback((notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        } else if (notification.postId) {
            const fragment = notification.replyId ? `#comment-${notification.replyId}` : '';
            router.push(`/forum/${notification.postId}${fragment}`);
        }
        onOpenChange(false); // Tutup popover setelah klik notifikasi
    }, [router, markAsRead, onOpenChange]);


    return (
        <PopoverContent className="w-[350px] p-0" align="end" sideOffset={10}>
            <div className="flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifikasi Anda</h3>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/notifications")}
                        className="text-xs"
                    >
                        Lihat Semua
                    </Button>
                </div>
                {loading ? (
                    <div className="p-4 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : displayNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Tidak ada notifikasi terbaru.
                    </div>
                ) : (
                    <ScrollArea className="h-[250px]"> {/* Tinggi tetap untuk scroll */}
                        <div className="flex flex-col divide-y">
                            {displayNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start space-x-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/50" : ""}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`p-2 rounded-full text-white flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm flex items-center gap-1">
                                                {notification.title}
                                                {!notification.read && <div className="h-2 w-2 bg-primary rounded-full ml-1" />}
                                            </h4>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                {formatTimeAgo(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.message}
                                            {notification.commentContentPreview && (
                                                <span className="ml-1 italic">&quot;{notification.commentContentPreview}&quot;</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
                {/* Opsi tambahan seperti "Tandai Semua Dibaca" */}
                {notifications.length > 0 && unreadCount > 0 && (
                    <div className="p-2 border-t flex justify-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-center text-xs"
                            onClick={async () => {
                                // Panggil API untuk menandai semua dibaca
                                try {
                                    await fetch("/api/forum/notifications", { method: "PATCH" });
                                    toast.success("Semua notifikasi ditandai sebagai sudah dibaca.");
                                } catch (error) {
                                    toast.error(`Gagal menandai semua dibaca. ${error}`);
                                }
                            }}
                        >
                            Tandai semua sebagai sudah dibaca
                        </Button>
                    </div>
                )}
            </div>
        </PopoverContent>
    );
}