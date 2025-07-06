"use client"
import { signIn } from "next-auth/react"
import React from 'react'
import { Button } from '../ui/button'
import { signOut } from 'next-auth/react'

interface ProvideProps {
    provider: string
    name: string
}
export default function AuthButton({ provider, name }: ProvideProps) {
    return (
        <Button onClick={() => signIn(provider, { redirectTo: "/" })}>
            {name}
        </Button>
    )
}

export function SignOut() {
    return <Button variant="outline" className="w-full" onClick={() => signOut()}>Sign Out</Button>
}