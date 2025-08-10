// /app/notifications/page.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react"; // Import useSession
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Check, Trash2, CheckCheck, X, MessageSquare, Settings, AtSign, ThumbsUp } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/date-utils"; // Import formatTimeAgo

// Firestore imports for real-time listeners
import { clientDb } from "@/lib/firebase/firebase-client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// --- Interface Notifikasi & Tipe Terkait (dari @/types/forum) ---
import { Notification, NotificationType } from "@/types/forum";
import { Skeleton } from "@/components/ui/skeleton";


// --- Fungsi untuk mendapatkan ikon notifikasi ---
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
            return <Check className="h-4 w-4" />; // Or a custom solution icon
        case "system":
            return <Settings className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

// --- Fungsi untuk mendapatkan warna ikon notifikasi ---
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

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

    const router = useRouter();

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "loading") return;
        if (!userId) {
            toast.error("Anda harus login untuk melihat notifikasi.", { duration: 3000 });
            router.push("/login");
            return;
        }
        setLoading(false); // Set loading false after auth check
    }, [userId, status, router]);

    // --- Real-time Notifications with Firestore Snapshot ---
    useEffect(() => {
        if (!userId) return; // Don't fetch if user not logged in

        setLoading(true);
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(
            notificationsCollectionRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc") // Newest first
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications: Notification[] = [];
            snapshot.forEach((doc) => {
                fetchedNotifications.push({ id: doc.id, ...(doc.data() as Omit<Notification, 'id'>) });
            });
            setNotifications(fetchedNotifications);
            setLoading(false); // Data loaded
        }, (error) => {
            console.error("Error listening to notifications:", error);
            toast.error("Error real-time notifikasi", { description: "Gagal memuat notifikasi secara real-time." });
            setLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [userId]); // Re-run effect if userId changes

    const unreadCount = notifications.filter((n) => !n.read).length;
    const readCount = notifications.filter((n) => n.read).length;

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            if (activeTab === "unread") return !notification.read;
            if (activeTab === "read") return notification.read;
            return true;
        });
    }, [notifications, activeTab]);

    // --- Action Handlers ---

    // Menandai notifikasi sebagai sudah dibaca
    const markAsRead = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/forum/notifications/${id}`, { method: "PATCH" });
            const data = await response.json();
            if (!response.ok || !data.status) {
                throw new Error(data.message || "Gagal menandai notifikasi.");
            }
            toast.success("Notifikasi ditandai sebagai sudah dibaca.");
            // State will be updated by snapshot listener automatically
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast.error("Gagal menandai notifikasi.", { description: (error as Error).message });
        }
    }, []);

    // Menandai semua notifikasi sebagai sudah dibaca
    const markAllAsRead = useCallback(() => {
        if (!userId) {
            toast.error("Anda harus login untuk melakukan aksi ini.");
            return;
        }
        toast("Tandai Semua Sebagai Dibaca", {
            description: "Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?",
            action: {
                label: "Konfirmasi",
                onClick: async () => {
                    try {
                        const response = await fetch("/api/forum/notifications", { method: "PATCH" });
                        const data = await response.json();
                        if (!response.ok || !data.status) {
                            throw new Error(data.message || "Gagal menandai semua notifikasi.");
                        }
                        toast.success("Semua notifikasi ditandai sebagai sudah dibaca.");
                        // State will be updated by snapshot listener automatically
                    } catch (error) {
                        console.error("Error marking all notifications as read:", error);
                        toast.error("Gagal menandai semua notifikasi.", { description: (error as Error).message });
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [userId]);

    // Menghapus notifikasi individu
    const deleteNotification = useCallback((id: string) => {
        if (!userId) {
            toast.error("Anda harus login untuk melakukan aksi ini.");
            return;
        }
        toast("Hapus Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus notifikasi ini?",
            action: {
                label: "Hapus",
                onClick: async () => {
                    try {
                        const response = await fetch(`/api/forum/notifications/${id}`, { method: "DELETE" });
                        const data = await response.json();
                        if (!response.ok || !data.status) {
                            throw new Error(data.message || "Gagal menghapus notifikasi.");
                        }
                        toast.success("Notifikasi berhasil dihapus.");
                        // State will be updated by snapshot listener automatically
                    } catch (error) {
                        console.error("Error deleting notification:", error);
                        toast.error("Gagal menghapus notifikasi.", { description: (error as Error).message });
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [userId]);

    // Menghapus semua notifikasi
    const clearAllNotifications = useCallback(() => {
        if (!userId) {
            toast.error("Anda harus login untuk melakukan aksi ini.");
            return;
        }
        toast("Hapus Semua Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.",
            action: {
                label: "Hapus Semua",
                onClick: async () => {
                    try {
                        const response = await fetch("/api/forum/notifications", { method: "DELETE" });
                        const data = await response.json();
                        if (!response.ok || !data.status) {
                            throw new Error(data.message || "Gagal menghapus semua notifikasi.");
                        }
                        toast.success("Semua notifikasi berhasil dihapus.");
                        // State will be updated by snapshot listener automatically
                    } catch (error) {
                        console.error("Error deleting all notifications:", error);
                        toast.error("Gagal menghapus semua notifikasi.", { description: (error as Error).message });
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [userId]);

    // --- Handler saat notifikasi diklik ---
    const handleNotificationClick = useCallback((notification: Notification) => {
        // Tandai sebagai dibaca saat diklik
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Arahkan pengguna berdasarkan tipe notifikasi dan link
        if (notification.link) {
            router.push(notification.link);
        } else if (notification.postId) {
            // Default to post detail page if specific link not provided but postId exists
            const fragment = notification.replyId ? `#comment-${notification.replyId}` : '';
            router.push(`/forum/${notification.postId}${fragment}`);
        } else {
            toast.info("Tidak ada tautan untuk notifikasi ini.");
        }
    }, [router, markAsRead]);

    if (loading) {
        return (
            <div className="mx-2 md:mx-4 py-6 space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between">
                    <Skeleton className="h-9 w-44 mb-2" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full mb-6" />
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-start space-x-4 p-4 rounded-lg border">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center">
                    <Bell className="h-14 w-14" />
                    <div>
                        <h1 className="text-3xl font-bold">Notifikasi</h1>
                        <p className="text-muted-foreground">Kelola notifikasi dan pemberitahuan Anda</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button onClick={clearAllNotifications} variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Semua
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifikasi
                        {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
                    </CardTitle>
                    <CardDescription>
                        {notifications.length === 0 ? "Tidak ada notifikasi" : `${notifications.length} total notifikasi`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all" className="text-xs md:text-md">Semua ({notifications.length})</TabsTrigger>
                            <TabsTrigger value="unread" className="text-xs md:text-md">Belum Dibaca ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="read" className="text-xs md:text-md">Sudah Dibaca ({readCount})</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Tidak ada notifikasi</h3>
                                    <p className="text-muted-foreground">
                                        {activeTab === "unread"
                                            ? "Semua notifikasi sudah dibaca"
                                            : activeTab === "read"
                                                ? "Belum ada notifikasi yang dibaca"
                                                : "Belum ada notifikasi untuk ditampilkan"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${!notification.read ? "bg-muted/50 border-primary/20" : "bg-background"}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className={`p-2 rounded-full text-white ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        {notification.title}
                                                        {!notification.read && <div className="h-2 w-2 bg-primary rounded-full" />}
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        {!notification.read && (
                                                            <Button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.message}
                                                    {(notification.type === "forum_comment_on_post" ||
                                                        notification.type === "forum_reply_to_comment" ||
                                                        notification.type === "forum_mention" ||
                                                        notification.type === "forum_solution_marked") &&
                                                        notification.commentContentPreview && (
                                                            <span className="ml-1 italic">{notification.commentContentPreview}</span>
                                                        )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}