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
                    <Button>Login</Button>
                    <Button variant="destructive">Signout</Button>
                </div>
            </div>
        </header>
    )
}
