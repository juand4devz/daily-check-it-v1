import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcrypt";
import { login, loginWithGithub, loginWithGoogle } from "@/lib/firebase/service";
export type {
    Account,
    DefaultSession,
    Profile,
    Session,
    User,
} from "@auth/core/types"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        // Credentials providers
        CredentialsProvider({
            type: "credentials",
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials as {
                    email: string;
                    password: string;
                };
                const user: any = await login({ email });
                if (user) {
                    const passwordConfirm = await compare(password, user.password);
                    if (passwordConfirm) {
                        return user;
                    }
                    return null
                }
                return null
            }
        }),
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID! as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET! as string,
        }),
        // 2.3 GitHub Provider
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID! as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET! as string,
        }),
    ],
    // 2.4 Session dan JWT callbacks
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, account, profile, user }: any) {
            if (account?.provider === "credentials") {
                token.email = user.email as string;
                token.name = user.name as string;
                token.role = user.role as string;
            }

            if (account?.provider === "google" && profile) {
                const data = {
                    name: profile.name,
                    email: profile.email,
                    type: 'google',
                };

                // Menggunakan promise untuk loginWithGoogle
                const result = await new Promise((resolve) => {
                    loginWithGoogle(data, (result: { status: boolean, data: any }) => {
                        resolve(result)
                    });
                });

                if ((result as any).status) {
                    token.email = (result as any).data.email;
                    token.name = (result as any).data.name;
                    token.role = (result as any).data.role
                }
            }

            if (account?.provider === "github" && profile) {
                const data = {
                    name: profile.name,
                    email: profile.email,
                    type: 'github',
                };

                // Menggunakan promise untuk loginWithGoogle
                const result = await new Promise((resolve) => {
                    loginWithGithub(data, (result: { status: boolean, data: any }) => {
                        resolve(result)
                    });
                });

                if ((result as any).status) {
                    token.email = (result as any).data.email;
                    token.name = (result as any).data.name;
                    token.role = (result as any).data.role
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.role = token.role;
            return session
        }
    },
    pages: {
        signIn: "/login"
    }
});
