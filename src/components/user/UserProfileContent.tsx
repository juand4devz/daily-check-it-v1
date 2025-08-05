// /components/user/UserProfileContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    User,
    // Mail,
    Phone,
    MapPin,
    Globe,
    Github,
    Twitter,
    Linkedin,
    Instagram,
    MessageSquare,
    Link as LinkIcon,
    Calendar,
    Clock,
    Flag, // For reporting user
    AlertTriangle,
} from "lucide-react";
import { PostCard } from "@/components/forum/PostCard";
import { ReportDialog } from "@/components/shared/ReportDialog"; // Tetap impor untuk kasus report
import Image from "next/image";

import { formatDateTime } from "@/lib/utils/date-utils"; // Import formatTimeAgo for last login in profile
import { User as UserType } from "@/types/types";
import { ForumPost } from "@/types/forum";

interface UserProfileData {
    user: UserType;
    posts: ForumPost[];
}

interface UserProfileContentProps {
    userId: string;
    onClose?: () => void;
}

export function UserProfileContent({ userId, onClose }: UserProfileContentProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false); // State untuk dialog laporan

    // --- EFFECT: Fetch User Profile Data ---
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            setError("ID pengguna tidak valid.");
            return;
        }

        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/forum/users/${userId}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API Error Response: ${response.status} - ${errorText}`);
                    throw new Error("Failed to fetch user profile.");
                }
                const data = await response.json();
                if (data.status) {
                    setProfileData(data.data);
                } else {
                    setError(data.message || "Gagal memuat profil pengguna.");
                    toast.error("Gagal memuat profil", { description: data.message });
                }
            } catch (err) {
                console.error(`Error fetching profile for user ID ${userId}:`, err);
                setError((err as Error).message);
                toast.error("Error", { description: "Terjadi kesalahan saat memuat profil pengguna." });
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    const isCurrentUserProfile = profileData?.user?.id === currentUserId;

    if (loading) {
        return (
            <div className="flex flex-col w-full">
                <Skeleton className="h-48 w-full rounded-b-lg mb-4" />
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 z-10 relative px-4 sm:px-0">
                    <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background shadow-lg flex-shrink-0" />
                    <div className="flex-1 space-y-3 text-center md:text-left mt-10 md:mt-0 w-full">
                        <Skeleton className="h-10 w-3/4 max-w-sm mx-auto md:mx-0" />
                        <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
                        <Skeleton className="h-6 w-32 mx-auto md:mx-0" />
                        <Skeleton className="h-9 w-32 mx-auto md:mx-0 mt-4" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="text-center p-8 w-full">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Profil Pengguna Tidak Ditemukan</h2>
                <p className="text-muted-foreground mb-4">Pengguna dengan ID &quot;{userId}&quot; tidak ada atau telah dihapus.</p>
                {onClose && <Button type="button" onClick={onClose}>Tutup</Button>}
                {!onClose && <Button type="button" onClick={() => router.push("/")}>Kembali ke Beranda</Button>}
            </div>
        );
    }

    const { user, posts } = profileData;

    return (
        <div className="w-full">
            {/* Banner Section */}
            <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
                {user.banner ? (
                    <Image
                        src={user.banner}
                        alt={`${user.username}'s banner`}
                        layout="fill"
                        objectFit="cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Tidak ada gambar banner
                    </div>
                )}

                {!isCurrentUserProfile && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4 absolute top-0 right-5 rounded-xl"
                        onClick={() => setIsReportDialogOpen(true)}
                    >
                        <Flag className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Profile Header & Info (Avatar, Name, Bio, Badges) */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 mb-8 z-10 relative px-4 sm:px-0">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-lg flex-shrink-0">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                    <AvatarFallback className="text-5xl">{user.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3 text-center md:text-left mt-10 md:mt-20">
                    <h1 className="text-4xl font-bold">{user.username}</h1>
                    <p className="text-lg text-muted-foreground">{user.bio || "Tidak ada bio."}</p>
                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        {user.location && (
                            <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {user.location}
                            </Badge>
                        )}
                        {/* <Badge variant="secondary">{user.role}</Badge>
                        {user.isBanned && <Badge variant="destructive">Banned</Badge>} */}
                    </div>
                </div>
            </div>

            {/* Tabs untuk Konten Profil */}
            <Tabs defaultValue="posts" className="w-full px-4 sm:px-0">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="posts">
                        <MessageSquare className="h-4 w-4 mr-2" /> Forum Posts ({posts.length})
                    </TabsTrigger>
                    <TabsTrigger value="info">
                        <User className="h-4 w-4 mr-2" /> Informasi & Sosial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="mt-4">
                    {posts.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Pengguna ini belum membuat postingan forum.</h3>
                                {isCurrentUserProfile && (
                                    <Button type="button" onClick={() => router.push("/forum/new")}>Buat Postingan Pertama Anda</Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    initialIsLiked={post.likedBy?.includes(session?.user?.id || '') || false}
                                    initialLikeCount={post.likes}
                                    initialIsBookmarked={false}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="info" className="mt-4 space-y-6 grid grid-cols-1 md:grid-cols-2 md:gap-4">
                    {/* Card Informasi Dasar */}
                    <Card className="col-span-1 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Informasi Dasar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* {user.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{user.email}</span>
                                </div>
                            )} */}
                            {user.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{user.phone}</span>
                                </div>
                            )}
                            {user.createdAt && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Bergabung: {formatDateTime(user.createdAt)}</span>
                                </div>
                            )}
                            {user.lastLogin && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Terakhir Login: {formatDateTime(user.lastLogin)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Card Media Sosial */}
                    <Card className="col-span-1 w-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Media Sosial & Website</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {user.website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {user.website}
                                    </a>
                                </div>
                            )}
                            {user.github && (
                                <div className="flex items-center gap-2">
                                    <Github className="h-4 w-4 text-muted-foreground" />
                                    <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {user.github}
                                    </a>
                                </div>
                            )}
                            {user.twitter && (
                                <div className="flex items-center gap-2">
                                    <Twitter className="h-4 w-4 text-muted-foreground" />
                                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {user.twitter}
                                    </a>
                                </div>
                            )}
                            {user.linkedin && (
                                <div className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                                    <a href={`https://www.linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {user.linkedin}
                                    </a>
                                </div>
                            )}
                            {user.instagram && (
                                <div className="flex items-center gap-2">
                                    <Instagram className="h-4 w-4 text-muted-foreground" />
                                    <a href={`https://www.instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                        {user.instagram}
                                    </a>
                                </div>
                            )}
                            {!user.website && !user.github && !user.twitter && !user.linkedin && !user.instagram && (
                                <p className="text-sm text-muted-foreground italic">Tidak ada tautan media sosial.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Report Dialog for User (at the bottom of content) */}
            {user && (
                <ReportDialog
                    isOpen={isReportDialogOpen}
                    onOpenChange={setIsReportDialogOpen}
                    reportType="user"
                    entityId={user.id}
                    entityUsername={user.username}
                />
            )}
        </div>
    );
}