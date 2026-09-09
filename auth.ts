import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { PasswordVerifyResult, SecurePassword } from "@/lib/hash"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Required when using Credentials provider
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        // We only authenticate users who have a password (meaning they signed up locally)
        if (!user || !user.hashedPassword) return null;

        const result = await SecurePassword.verify(
          credentials.password as string,
          user.hashedPassword
        );

        if (result === PasswordVerifyResult.INVALID) return null;

        if (result === PasswordVerifyResult.VALID_NEEDS_REHASH) {
          // secure-password's own params (memlimit/opslimit) were upgraded
          // since this hash was written — same lazy-rehash-on-login pattern
          // STAPLE's own login.ts uses.
          const improvedHash = await SecurePassword.hash(credentials.password as string);
          await prisma.user.update({
            where: { id: user.id },
            data: { hashedPassword: improvedHash }
          });
        }

        return {
          ...user,
          id: user.id.toString()
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // The user object is only passed in the very first time they log in
      if (user) {
        if (user.id) {
          token.id = user.id.toString();
        }
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Here we pass the token data into the actual session object
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
      }
      return session;
    }
  }
})
