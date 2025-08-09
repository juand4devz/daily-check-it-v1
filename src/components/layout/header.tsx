// /components/layout/header.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle"; // Tetap impor
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { signIn, useSession } from "next-auth/react";
import { SignOut } from "../auth/auth-button";
import { Bell, User as UserIcon, Calendar, Clock, MapPin } from "lucide-react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { NotificationPopover } from "./NotificationPopover";
import Image from "next/image";

import { clientDb } from "@/lib/firebase/firebase-client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { User as UserType } from "@/types/types";
import { formatDateTime } from "@/lib/utils/date-utils";

export function Header() {
    const router = useRouter()
    const pathname = usePathname();
    const { data: session, status } = useSession();
    console.log(session)

    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] = useState(false);
    const [userProfileData, setUserProfileData] = useState<UserType | null>(null);

    const userId = session?.user?.id;

    useEffect(() => {
        if (!userId) {
            setUnreadNotificationsCount(0);
            return;
        }

        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(
            notificationsCollectionRef,
            where("userId", "==", userId),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadNotificationsCount(snapshot.size);
        }, (error) => {
            console.error("Error listening to unread notifications count:", error);
        });

        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (session?.user?.id && !userProfileData) {
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch(`/api/forum/users/${session.user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.status) {
                            setUserProfileData(data.data.user);
                        }
                    } else {
                        console.error("Failed to fetch user profile for header popover.");
                    }
                } catch (error) {
                    console.error("Error fetching user profile for header popover:", error);
                }
            };
            fetchUserProfile();
        }
        if (!session?.user?.id) {
            setUserProfileData(null);
        }
    }, [session, userProfileData]);


    const generateBreadcrumbs = () => {
        const segments = pathname.split("/").filter(Boolean)
        const mainSegment = segments[0] || "home"
        const mainLabel = mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1)
        const restSegments = segments.slice(1)

        return (
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href={`/${mainSegment}`}>{mainLabel}</BreadcrumbLink>
                </BreadcrumbItem>

                {restSegments.length > 0 && (
                    <span className="hidden md:flex">
                        {restSegments.map((segment, index) => {
                            const href = `/${[mainSegment, ...restSegments.slice(0, index + 1)].join("/")}`
                            const label = segment.charAt(0).toUpperCase() + segment.slice(1)
                            const isLast = index === restSegments.length - 1

                            return (
                                <React.Fragment key={href}>
                                    <BreadcrumbSeparator className="flex self-center-safe mr-2" />
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            )
                        })}
                    </span>
                )}
            </BreadcrumbList>
        )
    }

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center w-full gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>{generateBreadcrumbs()}</Breadcrumb>

                <div className="ml-auto flex items-center gap-2">
                    {/* NEW: ThemeToggle dipindahkan ke sini, di samping ikon notifikasi */}
                    <ThemeToggle />

                    {/* Notification Icon */}
                    {session && userId && (
                        <Popover open={isNotificationPopoverOpen} onOpenChange={setIsNotificationPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="relative h-9 w-9">
                                    <Bell className="h-5 w-5" />
                                    {unreadNotificationsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-xl bg-red-500 text-[11px] font-bold text-white">
                                            {unreadNotificationsCount > 9 ? "10+" : unreadNotificationsCount}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <NotificationPopover
                                unreadCount={unreadNotificationsCount}
                                onOpenChange={setIsNotificationPopoverOpen}
                            />
                        </Popover>
                    )}

                    {status === "loading" ? null : session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="relative rounded-full h-9 w-9 overflow-hidden">
                                    <div className="absolute inset-0">
                                        {userProfileData?.banner ? (
                                            <Image
                                                src={userProfileData.banner}
                                                alt="banner"
                                                layout="fill"
                                                objectFit="cover"
                                                className="opacity-40"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-40"></div>
                                        )}
                                        <Avatar className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 border border-white">
                                            <AvatarImage src={session.user.avatar || ""} alt="Profile" />
                                            <AvatarFallback className="rounded-full">
                                                {session.user.username?.[0]?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="mr-4 mt-2 min-w-64 p-2">
                                <div className="relative h-20 w-full rounded-md mb-2">
                                    {userProfileData?.banner ? (
                                        <Image
                                            src={userProfileData.banner}
                                            alt="banner"
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm">
                                            No Banner
                                        </div>
                                    )}
                                    <Avatar className="absolute -bottom-6 left-2 h-16 w-16 border-2 border-background">
                                        <AvatarImage src={session.user.avatar || "/placeholder.svg"} alt="Profile" />
                                        <AvatarFallback>{session.user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="px-2 pb-2 mt-6">
                                    <DropdownMenuLabel className="!p-0 text-base font-semibold">{session.user?.username}</DropdownMenuLabel>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{session.user?.email}</p>
                                    {userProfileData?.bio && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{userProfileData.bio}</p>
                                    )}
                                    {userProfileData?.location && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <MapPin className="h-3 w-3" /> {userProfileData.location}
                                        </div>
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                {userProfileData && (
                                    <>
                                        <DropdownMenuItem className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Bergabung: {formatDateTime(userProfileData.createdAt)}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Terakhir Login: {formatDateTime(userProfileData.lastLogin)}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => router.push(`/users/${session.user?.id}`)}>
                                            <UserIcon className="h-4 w-4 mr-2" /> Lihat Profil Lengkap
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {/* Theme Toggle TIDAK LAGI DI SINI */}
                                <DropdownMenuItem onSelect={() => { /* noop */ }}>
                                    <SignOut />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button type="button" onClick={() => signIn()} variant="secondary">
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}