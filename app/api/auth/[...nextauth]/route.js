import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@/prisma/client";
import { findUserByUsername, findUserById, createUser } from "@/repos/users";

const prisma = new PrismaClient();

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const res = await fetch(`${process.env.NEXTAUTH_URL}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: credentials.username,
                        password: credentials.password,
                    }),
                });
                const user = await res.json();
                if (res.ok && user) {
                    return {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        role: user.role,
                    };
                }
                return null;
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === "google") {
                let existingUser = await findUserByUsername(profile.email);

                if (!existingUser) {
                    let newId;
                    let isUnique = false;
                    while (!isUnique) {
                        newId = Math.floor(100000000 + Math.random() * 900000000);
                        const idCheck = await findUserById(newId);
                        if (!idCheck) {
                            isUnique = true;
                        }
                    }

                    const newUser = await createUser({
                        id: newId,
                        username: profile.email,
                        name: profile.name || "Unnamed",
                        role: "STUDENT",
                        password: "google_oauth",
                    });

                    existingUser = newUser;
                }

                user.id = existingUser.id;
                user.role = existingUser.role;
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            return baseUrl;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };