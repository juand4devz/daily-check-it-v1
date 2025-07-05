"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Brain,
    Computer,
    Home,
    MessageSquare,
    Settings,
    Users,
    Wrench,
    User,
    LogOut,
    MoreVertical,
    LucideIcon,
    Drone,
    User2,
    Bell,
    TagIcon, // Import LucideIcon type for icon components
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// --- Tipe untuk Struktur Navigasi ---
interface NavItem {
    title: string
    href: string
    icon?: LucideIcon
    exactMatch?: boolean // Untuk menentukan apakah cocok persis atau awalan
    subItems?: NavItem[]
}

interface NavGroup {
    label: string
    items: NavItem[]
}

// --- Data Konfigurasi Navigasi ---
const mainNavigation: NavItem[] = [
    {
        title: "Home",
        href: "/",
        icon: Home,
        exactMatch: true,
    },
    {
        title: "Diagnose",
        href: "/diagnose",
        icon: Computer,
    },
]

const knowledgeBaseNavigation: NavItem[] = [
    {
        title: "Teknisi AI Virtual",
        href: "/ai-assistance",
        icon: Drone,
        exactMatch: false, // Matches /forum/ or /discussion-forum
    },
    {
        title: "Forum Diskusi",
        href: "/forum",
        icon: MessageSquare,
        exactMatch: false, // Matches /forum/ or /discussion-forum
    },
]

const adminNavigation: NavItem[] = [
    {
        title: "Knowledge Management",
        href: "/admin/symptoms", // Default link for the parent item
        icon: Wrench,
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
]

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
]

// Gabungkan semua grup navigasi
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
    },
    {
        label: "Personal Hub",
        items: personalHub,
    },
]

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
    customClassName?: string // Contoh properti
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
    const pathname = usePathname()

    // Helper function to determine if a path is active
    const isLinkActive = (href: string, exactMatch?: boolean) => {
        if (exactMatch) {
            return pathname === href
        }
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    const renderSidebarItem = (item: NavItem) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isLinkActive(item.href, item.exactMatch)}>
                <Link href={item.href}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
            {item.subItems && item.subItems.length > 0 && (
                <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton asChild isActive={isLinkActive(subItem.href, subItem.exactMatch)}>
                                <Link href={subItem.href}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    )

    return (
        <Sidebar collapsible="icon" className={className} {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                                    <Brain className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">DailyCheckIt</span>
                                    <span className="text-xs">development v1</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {navigationGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map(renderSidebarItem)}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-100">
                                    <Image height="40" width="40"
                                        src="/placeholder.svg?height=32&width=32"
                                        alt="User avatar"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">John Doe</span>
                                    <span className="text-xs text-muted-foreground">john@example.com</span>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}