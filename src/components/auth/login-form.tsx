"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "../ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"

export function LoginForm({
    className,
    searchParams,
    ...props
}: React.ComponentPropsWithoutRef<"div"> & { searchParams?: Record<string, string> }) {
    const { push } = useRouter();
    const [error, setError] = useState<string>("");
    const [isLoading, setIsloading] = useState<boolean>(false);

    const callbackUrl = searchParams?.callback || "/";

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsloading(true);

        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                callbackUrl
            })
            if (!res?.error) {
                form.reset()
                setIsloading(false);
                push(callbackUrl)
            } else {
                if (res.status === 401) {
                    setError("Email or password is Incorect");
                    setIsloading(false)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                        {error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => handleLogin(e)}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    name="email"
                                    id="email"
                                    type="email"
                                    placeholder="example@gmail.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <Button disabled={isLoading} type="submit" className="w-full">
                                Login
                            </Button>
                            <Button type="submit" variant="outline" className="w-full">
                                Login with Google
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <a href="#" className="underline underline-offset-4">
                                Sign up
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
