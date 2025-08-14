import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getUser } from "@/app/_lib/data-service";
import { compare } from "bcryptjs";
import { CustomError } from "@/app/_lib/errors";
import { prisma } from "@/lib/prisma";

const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            credentials: {},
            authorize: async (credentials) => {
                // console.log("credentials auth with adapter::::", credentials);
                const { email, password } = credentials;

                if (!email || !password) {
                    throw new CustomError("Email và mật khẩu là bắt buộc");
                }

                const user = await getUser(email);
                // console.log("User login authorize:", user);

                if (!user) {
                    throw new CustomError("Tài khoản không tồn tại");
                }

                const isValidPassword = await compare(password, user.password);

                if (!isValidPassword) throw new CustomError("Sai mật khẩu");

                return user;
            },
        }),
    ],
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // console.log("Account callbacks:", account);
            // console.log("User callbacks login::::", user);
            if (user) return true;
            return false;
        },
        async jwt({ token, user, isNewUser }) {
            // console.log("🧪 jwt callback — token:", token, "user:", user);
            if (user) {
                // console.log("Jwt login first:::");
                const { id, password, ...rest } = user;
                token.id = user.id;
                return { ...token, ...rest };
            }
            if (isNewUser) {
                console.log("NewUser sign In 🎉:", user);
            }
            return token;
        },
        async session({ session, token, user }) {
            // console.log("🧪 Sesssion callback::::", session);
            if (token?.id) {
                session.user = {
                    id: token.id,
                    image: token.picture,
                    ...session.user,
                    ...token,
                };
                // console.log("Sesssion user::", session.user);
            }
            return session;
            // await new Promise((res) => setTimeout(res, 3000));
        },
        async redirect({ url, baseUrl }) {
            // console.log("Callbacks redirect dc goi: 🧪");
            return baseUrl;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    // debug: true,
    // pages: {
    //     signIn: "/login",
    // },
};

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth,
} = NextAuth(authConfig);
