"use client"

import { usePathname } from "next/navigation"
import React from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { signIn, useSession } from "next-auth/react"
import { SignOut } from "../auth/auth-button"

export function Header() {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    console.log(session)

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
        <header className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center w-full px-4 gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>{generateBreadcrumbs()}</Breadcrumb>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    {status === "loading" ? null : session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Avatar className="h-10 w-10 border-4 rounded-xl">
                                    {session.user?.avatar ? (
                                        <AvatarImage src={session.user.avatar} alt="Profile" />
                                    ) : (
                                        <AvatarFallback className="rounded-none">
                                            {(() => {
                                                const username = session.user?.username || ""
                                                const initials = username
                                                    .split(" ")
                                                    .slice(0, 2)
                                                    .map((word) => word[0])
                                                    .join("")
                                                return initials.toUpperCase()
                                            })()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="mr-14 mt-2 min-w-40">
                                <DropdownMenuLabel>Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>{session.user?.username}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>{session.user?.email}</DropdownMenuItem>
                                <DropdownMenuItem>
                                    <SignOut />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={() => signIn()} variant="secondary">
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </header>
    )
}
