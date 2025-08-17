"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Users,
    LogOut,
    LucideIcon,
    Drone,
    User2,
    Bell,
    TagIcon,
    Waypoints,
    ScanSearch,
    LandPlot,
    SigmaSquare,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import Logo from "../ui/logos";

// --- Tipe untuk Struktur Navigasi ---
interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon;
    exactMatch?: boolean;
    subItems?: NavItem[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
    role?: "admin";
}

// --- Data Konfigurasi Navigasi ---
const mainNavigation: NavItem[] = [
    {
        title: "Home",
        href: "/forum-feed",
        icon: Home,
        exactMatch: true,
    },
    {
        title: "Diagnose",
        href: "/diagnose",
        icon: ScanSearch,
    },
];

const knowledgeBaseNavigation: NavItem[] = [
    {
        title: "Teknisi AI Virtual",
        href: "/ai-assistance",
        icon: Drone,
        exactMatch: false,
    },
    {
        title: "Forum Diskusi",
        href: "/forum",
        icon: Waypoints,
        exactMatch: false,
    },
];

const adminNavigation: NavItem[] = [
    {
        title: "Knowledge Management",
        href: "/admin/symptoms",
        icon: SigmaSquare,
        subItems: [
            {
                title: "Symptoms",
                href: "/admin/symptoms",
                exactMatch: true,
            },
            {
                title: "Damages",
                href: "/admin/damages",
                exactMatch: true,
            },
            {
                title: "Scope Massa",
                href: "/admin/massscope",
                exactMatch: true,
            },
        ],
    },
    {
        title: "User Management",
        href: "/admin/users",
        icon: Users,
        exactMatch: true,
    },
    {
        title: "Reports",
        href: "/admin/reports",
        icon: LandPlot,
        exactMatch: true,
    },
];

const personalHub: NavItem[] = [
    {
        title: "Bookmarks",
        href: "/bookmarks",
        icon: TagIcon,
        exactMatch: true,
    },
    {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        exactMatch: true,
    },
    {
        title: "Profile",
        href: "/profile",
        icon: User2,
        exactMatch: true,
    },
];

const navigationGroups: NavGroup[] = [
    {
        label: "Main",
        items: mainNavigation,
    },
    {
        label: "Knowledge Base",
        items: knowledgeBaseNavigation,
    },
    {
        label: "Administration",
        items: adminNavigation,
        role: "admin",
    },
    {
        label: "Personal Hub",
        items: personalHub,
    },
];

// --- Komponen Skeleton untuk seluruh konten sidebar ---
const SidebarSkeleton = () => (
    <div className="flex flex-col gap-4 p-2">
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" /> {/* Skeleton untuk label grup */}
            <Skeleton className="h-10 w-full" /> {/* Skeleton untuk item menu */}
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
);

// --- Komponen klien untuk konten dinamis ---
const DynamicSidebarContent = () => {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const isLinkActive = (href: string, exactMatch?: boolean) => {
        if (exactMatch) {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const renderSidebarItem = (item: NavItem) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
                asChild
                isActive={isLinkActive(item.href, item.exactMatch)}
            >
                <Link href={item.href}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
            {item.subItems && item.subItems.length > 0 && (
                <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton
                                asChild
                                isActive={isLinkActive(subItem.href, subItem.exactMatch)}
                            >
                                <Link href={subItem.href}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );

    return (
        <ScrollArea className="h-full max-h-[calc(100vh-4rem)] pr-2">
            <div className="flex flex-col gap-2">
                {/* Tampilkan skeleton saat loading */}
                {status === "loading" && <SidebarSkeleton />}

                {/* Tampilkan menu setelah loading selesai */}
                {(status === "authenticated" || status === "unauthenticated") &&
                    navigationGroups.map((group) => {
                        // Sembunyikan menu admin jika user bukan admin
                        if (group.role === "admin" && session?.user?.role !== "admin") {
                            return null;
                        }
                        return (
                            <SidebarGroup key={group.label}>
                                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map(renderSidebarItem)}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        );
                    })}
            </div>
        </ScrollArea>
    );
};

// --- Komponen utama SidebarNav ---
interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
    customClassName?: string;
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
    const { data: session, status } = useSession();

    const handleLogout = () => {
        toast("Yakin ingin keluar?", {
            description: "Anda akan keluar dari sesi ini. Tindakan ini tidak dapat dibatalkan.",
            action: {
                label: "Keluar",
                onClick: () => {
                    signOut();
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => { },
            },
        });
    };

    const isLoading = status === "loading";

    return (
        <Sidebar collapsible="icon" className={className} {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Logo />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="relative group">
                <DynamicSidebarContent />
            </SidebarContent>

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="py-6 px-2 flex items-center justify-center">
                            <div className="flex w-full items-center justify-between">
                                <div className="flex items-center justify-center gap-2">
                                    {/* Skeleton untuk avatar */}
                                    {isLoading ? (
                                        <Skeleton className="h-7 w-7 rounded-full" />
                                    ) : (
                                        <Avatar className="rounded-xl">
                                            {session?.user?.avatar ? (
                                                <AvatarImage
                                                    src={session?.user?.avatar}
                                                    alt={session?.user.username}
                                                    height={50}
                                                    width={50}
                                                />
                                            ) : (
                                                <AvatarFallback className="rounded-none">
                                                    {(() => {
                                                        const username = session?.user?.username || "";
                                                        const words = username.trim().split(" ");
                                                        if (words.length >= 2) {
                                                            return (words[0][0] + words[1][0]).toUpperCase();
                                                        }
                                                        return username.slice(0, 2).toUpperCase();
                                                    })()}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                    )}
                                    <div className="flex flex-col items-start gap-y-1">
                                        <span className="text-sm font-medium">
                                            {/* Skeleton untuk nama pengguna */}
                                            {isLoading ? (
                                                <Skeleton className="bg-neutral-700 rounded-xs h-4 w-[100px]" />
                                            ) : (
                                                session?.user?.username || "Guest"
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {/* Skeleton untuk email */}
                                            {isLoading ? (
                                                <Skeleton className="bg-neutral-800 rounded-xs h-4 w-[120px]" />
                                            ) : (
                                                session?.user?.email || "Belum Login"
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* Tombol logout hanya tampil jika sudah login */}
                                {session && (
                                    <Button onClick={handleLogout} asChild variant="ghost" size="icon">
                                        <LogOut className="h-4 w-4 hover:text-red-600" />
                                    </Button>
                                )}
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}