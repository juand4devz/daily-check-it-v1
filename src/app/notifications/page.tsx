"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Bell, Check, Trash2, CheckCheck, X, User, MessageSquare, Settings, AlertCircle } from "lucide-react"

interface Notification {
    id: string
    type: "welcome" | "diagnosis" | "forum" | "system" | "account"
    title: string
    message: string
    read: boolean
    createdAt: string
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "welcome",
        title: "Selamat Datang!",
        message: "Terima kasih telah bergabung dengan Sistem Diagnosa Pakar. Mulai diagnosa pertama Anda sekarang!",
        read: false,
        createdAt: "2024-01-20T10:30:00Z",
    },
    {
        id: "2",
        type: "diagnosis",
        title: "Diagnosa Selesai",
        message: "Hasil diagnosa untuk masalah 'Komputer tidak bisa booting' telah tersedia. Tingkat kepercayaan: 85%",
        read: false,
        createdAt: "2024-01-21T14:15:00Z",
    },
    {
        id: "3",
        type: "forum",
        title: "Balasan Baru",
        message: "Ada balasan baru untuk pertanyaan Anda tentang 'Masalah Blue Screen'",
        read: true,
        createdAt: "2024-01-22T09:30:00Z",
    },
    {
        id: "4",
        type: "system",
        title: "Pembaruan Sistem",
        message: "Sistem telah diperbarui dengan algoritma diagnosa yang lebih akurat",
        read: false,
        createdAt: "2024-01-23T08:00:00Z",
    },
    {
        id: "5",
        type: "account",
        title: "Profil Diperbarui",
        message: "Profil Anda telah berhasil diperbarui",
        read: true,
        createdAt: "2024-01-25T15:45:00Z",
    },
    {
        id: "6",
        type: "forum",
        title: "Post Disukai",
        message: "Post Anda 'Tips Maintenance PC' mendapat 10 likes baru",
        read: false,
        createdAt: "2024-01-26T11:20:00Z",
    },
]

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "welcome":
            return <User className="h-4 w-4" />
        case "diagnosis":
            return <AlertCircle className="h-4 w-4" />
        case "forum":
            return <MessageSquare className="h-4 w-4" />
        case "system":
            return <Settings className="h-4 w-4" />
        case "account":
            return <User className="h-4 w-4" />
        default:
            return <Bell className="h-4 w-4" />
    }
}

const getNotificationColor = (type: string): string => {
    switch (type) {
        case "welcome":
            return "bg-blue-500"
        case "diagnosis":
            return "bg-green-500"
        case "forum":
            return "bg-purple-500"
        case "system":
            return "bg-orange-500"
        case "account":
            return "bg-gray-500"
        default:
            return "bg-blue-500"
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
    const [activeTab, setActiveTab] = useState("all")

    const unreadCount = notifications.filter((n) => !n.read).length
    const readCount = notifications.filter((n) => n.read).length

    const filteredNotifications = notifications.filter((notification) => {
        if (activeTab === "unread") return !notification.read
        if (activeTab === "read") return notification.read
        return true
    })

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        toast.success("Notifikasi ditandai sebagai sudah dibaca")
    }

    const markAllAsRead = () => {
        toast("Tandai Semua Sebagai Dibaca", {
            description: "Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?",
            action: {
                label: "Konfirmasi",
                onClick: () => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                    toast.success("Semua notifikasi ditandai sebagai sudah dibaca")
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        })
    }

    const deleteNotification = (id: string) => {
        const notification = notifications.find((n) => n.id === id)
        if (!notification) return

        toast("Hapus Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus notifikasi ini?",
            action: {
                label: "Hapus",
                onClick: () => {
                    setNotifications((prev) => prev.filter((n) => n.id !== id))
                    toast.success("Notifikasi berhasil dihapus")
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        })
    }

    const clearAllNotifications = () => {
        toast("Hapus Semua Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.",
            action: {
                label: "Hapus Semua",
                onClick: () => {
                    setNotifications([])
                    toast.success("Semua notifikasi berhasil dihapus")
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        })
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "Baru saja"
        if (diffInHours < 24) return `${diffInHours} jam yang lalu`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays} hari yang lalu`

        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifikasi</h1>
                    <p className="text-muted-foreground">Kelola notifikasi dan pemberitahuan Anda</p>
                </div>
                <div className="flex items-center space-x-2">
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
                            <TabsTrigger value="all">Semua ({notifications.length})</TabsTrigger>
                            <TabsTrigger value="unread">Belum Dibaca ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="read">Sudah Dibaca ({readCount})</TabsTrigger>
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
                                            className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${!notification.read ? "bg-muted/50 border-primary/20" : "bg-background"
                                                }`}
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
                                                            <Button onClick={() => markAsRead(notification.id)} variant="ghost" size="sm">
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button onClick={() => deleteNotification(notification.id)} variant="ghost" size="sm">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
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
    )
}
