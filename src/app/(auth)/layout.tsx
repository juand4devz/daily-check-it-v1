export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[url('/auth-bg-light.png')] dark:bg-[url('/auth-bg-dark.png')] bg-cover bg-center bg-no-repeat max-h-screen flex items-center justify-center">
            <div className="flex min-h-svh w-full items-center justify-end p-6 md:p-10">
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div >
    )
}
