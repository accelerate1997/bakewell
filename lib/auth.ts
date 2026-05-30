import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { phone: credentials.identifier },
            ],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "firebase",
      name: "firebase",
      credentials: {
        token: { label: "Firebase Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        try {
          // Verify the client's Firebase token against Google's public certificates
          const decodedToken = await verifyFirebaseToken(credentials.token);
          if (!decodedToken) {
            return null;
          }
          const { email, phone_number, name } = decodedToken;

          if (!email && !phone_number) {
            console.error("Firebase token verification returned no email or phone number.");
            return null;
          }

          // Check if this user exists in PostgreSQL (match by email or phone)
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                email ? { email } : undefined,
                phone_number ? { phone: phone_number } : undefined,
              ].filter(Boolean) as any,
            },
          });

          // Auto-signup if they do not exist
          if (!user) {
            const userCount = await prisma.user.count();
            const role = userCount === 0 ? "ADMIN" : "CUSTOMER";

            user = await prisma.user.create({
              data: {
                email: email || null,
                phone: phone_number || null,
                name: name || (email ? email.split("@")[0] : "Customer"),
                role,
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          };
        } catch (error) {
          console.error("Firebase token verification failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
};
