"use client"

import { usePathname } from "next/navigation"
import React from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { signIn, useSession } from "next-auth/react"
import AuthButton, { SignOut } from "../auth/auth-button"
import Link from "next/link"

export function Header() {
    const pathname = usePathname()

    // Generate breadcrumbs based on pathname
    const generateBreadcrumbs = () => {
        const paths = pathname.split("/").filter(Boolean)

        if (paths.length === 0) {
            return (
                <BreadcrumbItem>
                    <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
            )
        }

        return paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join("/")}`
            const isLast = index === paths.length - 1
            const label = path.charAt(0).toUpperCase() + path.slice(1)

            return (
                <React.Fragment key={href}>
                    <BreadcrumbItem>
                        {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : <BreadcrumbLink href={href}>{label}</BreadcrumbLink>}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
            )
        })
    }

    const { data: session } = useSession()
    console.log(session)

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 px-4 w-full">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>{generateBreadcrumbs()}</BreadcrumbList>
                </Breadcrumb>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    <AuthButton provider='github' name='Github' />
                    <AuthButton provider='google' name='Google' />
                    <Button onClick={() => signIn()} variant="secondary">Login</Button>
                    <Button variant="secondary"><Link href="/register">register</Link></Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar className='h-10 w-10 border-4'>
                                {session?.user?.image ? (
                                    <AvatarImage src={session?.user?.image} alt='Profile Picture' height={50} width={50} />
                                ) : (
                                    <AvatarFallback>
                                        {(() => {
                                            const name = session?.user?.name || '';
                                            const words = name.trim().split(' ');
                                            if (words.length >= 2) {
                                                return (words[0][0] + words[1][0]).toUpperCase();
                                            }
                                            return name.slice(0, 2).toUpperCase();
                                        })()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='mr-14 mt-2 min-w-40'>
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{session?.user?.name}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{session?.user?.email}</DropdownMenuItem>
                            <DropdownMenuItem>
                                <SignOut />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
