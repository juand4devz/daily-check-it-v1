"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await signIn("credentials", { email, password, isRegister, callbackUrl: "/" });
    };

    return (
        <form onSubmit={onSubmit}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <label>
                <input type="checkbox" checked={isRegister} onChange={() => setIsRegister(!isRegister)} />
                Register?
            </label>
            <button type="submit">{isRegister ? "Register" : "Login"}</button>
            <button type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>Google</button>
            <button type="button" onClick={() => signIn("github", { callbackUrl: "/" })}>GitHub</button>
        </form>
    );
}
