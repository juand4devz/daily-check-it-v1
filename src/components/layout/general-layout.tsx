"use client"
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { SidebarNav } from './app-sidebar';
import { Header } from './header';
import { usePathname } from "next/navigation"
import { ThemeProvider } from './theme-provider';

interface MainLayoutProps {
    children: React.ReactNode
}



export default function GeneralLayout({ children }: MainLayoutProps) {
    const disableSideheader = ["/login", "/register"]

    const pathname = usePathname();

    // Prevent rendering until pathname is available
    if (!pathname) {
        return null;
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider>
                {!disableSideheader.includes(pathname) && <SidebarNav />}
                <SidebarInset>
                    {!disableSideheader.includes(pathname) && <Header />}
                    {/* <main className="flex-1 p-4"> */}
                    {children}
                    {/* </main> */}
                </SidebarInset>
            </SidebarProvider>
        </ThemeProvider>
    )
}
