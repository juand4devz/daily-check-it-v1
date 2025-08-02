// /components/user/UserProfileClickPopover.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { formatDateTime, formatTimeAgo } from "@/lib/utils/date-utils";
import { User as UserType } from "@/types/types";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";

interface UserProfileClickPopoverProps {
    children: React.ReactNode;
    userId: string;
}

export function UserProfileClickPopover({ children, userId }: UserProfileClickPopoverProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId && !userData) {
            setLoading(true);
            setError(null);
            const fetchUser = async () => {
                try {
                    const response = await fetch(`/api/forum/users/${userId}`);
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(errorText || "Gagal memuat data pengguna.");
                    }
                    const data = await response.json();
                    if (data.status && data.data?.user) {
                        setUserData(data.data.user);
                    } else {
                        throw new Error(data.message || "Data pengguna tidak valid.");
                    }
                } catch (err) {
                    console.error("Error fetching user for popover:", err);
                    setError((err as Error).message);
                    toast.error("Gagal memuat profil pengguna.", { description: (err as Error).message });
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }
        if (!isOpen) {
            setUserData(null);
            setError(null);
        }
    }, [isOpen, userId, userData]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                className="w-72 p-0"
                align="start"
                sideOffset={10}
                onMouseDown={(e) => e.stopPropagation()} // FIX: Tambahkan ini untuk menghentikan perambatan event
                onClick={(e) => e.stopPropagation()} // FIX: Tambahkan ini juga sebagai jaring pengaman
            >
                {loading ? (
                    <div className="p-4 flex flex-col items-center gap-3">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-9 w-full mt-4" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                        <p className="text-sm">Error: {error}</p>
                    </div>
                ) : userData ? (
                    <Card className="border-none shadow-none">
                        <div className="relative h-20 w-full rounded-t-md">
                            {userData.banner ? (
                                <Image
                                    src={userData.banner}
                                    alt={`${userData.username}'s banner`}
                                    layout="fill"
                                    objectFit="cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs">
                                    No Banner
                                </div>
                            )}
                            <Avatar className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 border-2 border-background shadow-md">
                                <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.username} />
                                <AvatarFallback className="text-2xl">{userData.username[0]}</AvatarFallback>
                            </Avatar>
                        </div>

                        <CardContent className="p-4 pt-10 flex flex-col items-center">
                            <h4 className="font-bold text-lg">{userData.username}</h4>
                            {userData.bio && <p className="text-sm text-muted-foreground text-center line-clamp-2">{userData.bio}</p>}
                            <div className="flex gap-2 mt-2">
                                {userData.location && (
                                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <MapPin className="h-3 w-3" /> {userData.location}
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">{userData.role}</Badge>
                                {userData.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                            </div>
                            <Separator className="my-3 w-full" />
                            <div className="w-full space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Bergabung: {formatDateTime(userData.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Terakhir Login: {formatTimeAgo(userData.lastLogin)}</span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full mt-4"
                                onClick={(e) => {
                                    e.stopPropagation(); // FIX: Tambahkan ini untuk mencegah klik merambat
                                    router.push(`/users/${userData.id}`);
                                    setIsOpen(false);
                                }}
                            >
                                Lihat Profil Lengkap
                            </Button>
                        </CardContent>
                    </Card>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}