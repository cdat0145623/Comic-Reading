import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("Account callbacks:", account);
            return true;
        },
        async jwt({ token, user, isNewUser }) {
            console.log("🧪 jwt callback auth— token:", token, "user:", user);
            if (user) {
                token.id = user.id;
            }
            if (isNewUser) {
                console.log("NewUser sign In 🎉:", user);
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id;
            }
            // await new Promise((res) => setTimeout(res, 3000));
            return session;
        },
        async redirect({ url, baseUrl }) {
            return baseUrl;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
};

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth,
} = NextAuth(authConfig);
