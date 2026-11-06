import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // 1. Google OAuth Provider (activated when credentials are provided)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
            // Always show the Google account chooser so users can pick any account
            authorization: { params: { prompt: "select_account" } },
            profile(profile) {
              const isSuperAdmin =
                Boolean(process.env.SUPER_ADMIN_EMAIL) &&
                profile.email?.toLowerCase().trim() ===
                  process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                role: isSuperAdmin ? "SUPER_ADMIN" : "STUDENT",
                status: "ACTIVE",
                emailVerified: new Date(),
                onboardingComplete: false,
              };
            },
          }),
        ]
      : []),

    // 2. Credentials Provider (Email + Password)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Validate input schema
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) {
          throw new Error("Invalid email or password format");
        }

        const { email, password } = validated.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: 5 attempts per 15 minutes per email
        const rateLimitResult = checkRateLimit(`login:${normalizedEmail}`, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });

        if (!rateLimitResult.success) {
          await logAuditEvent({
            action: "AUTH_LOGIN_FAILED",
            metadata: {
              email: normalizedEmail,
              reason: "RATE_LIMITED",
            },
          });
          throw new Error(
            rateLimitResult.message || "Too many failed attempts. Please try again later."
          );
        }

        // Query user from database
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          await logAuditEvent({
            action: "AUTH_LOGIN_FAILED",
            metadata: {
              email: normalizedEmail,
              reason: "USER_NOT_FOUND_OR_OAUTH_ONLY",
            },
          });
          // Generic error message: never reveal email existence
          throw new Error("Invalid email or password");
        }

        // Check if user is suspended or deleted
        if (user.status === "SUSPENDED") {
          await logAuditEvent({
            userId: user.id,
            action: "AUTH_LOGIN_BLOCKED_SUSPENDED",
            metadata: { email: normalizedEmail },
          });
          throw new Error("Your account has been suspended. Please contact support.");
        }

        if (user.status === "DELETED") {
          throw new Error("Invalid email or password");
        }

        // Compare password hash with bcrypt
        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          await logAuditEvent({
            userId: user.id,
            action: "AUTH_LOGIN_FAILED",
            metadata: {
              email: normalizedEmail,
              reason: "PASSWORD_MISMATCH",
            },
          });
          throw new Error("Invalid email or password");
        }

        // Reset rate limit on success
        resetRateLimit(`login:${normalizedEmail}`);

        // Auto-promote super admin if verified
        const isSuperAdminEmail =
          Boolean(process.env.SUPER_ADMIN_EMAIL) &&
          normalizedEmail === process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

        let activeRole = user.role;
        if (isSuperAdminEmail && user.emailVerified && user.role !== "SUPER_ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "SUPER_ADMIN" },
          });
          activeRole = "SUPER_ADMIN" as any;
        }

        // Log successful login
        await logAuditEvent({
          userId: user.id,
          action: "AUTH_LOGIN_SUCCESS",
          metadata: { email: normalizedEmail, verified: Boolean(user.emailVerified) },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: activeRole,
          status: user.status,
          onboardingComplete: user.onboardingComplete,
          emailVerified: Boolean(user.emailVerified),
        };
      },
    }),
  ],
  events: {
    async linkAccount({ user }) {
      if (user.id) {
        const isSuperAdmin =
          Boolean(process.env.SUPER_ADMIN_EMAIL) &&
          user.email?.toLowerCase().trim() ===
            process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            ...(isSuperAdmin ? { role: "SUPER_ADMIN" } : {}),
          },
        });
        await logAuditEvent({
          userId: user.id,
          action: "AUTH_ACCOUNT_LINKED",
        });
      }
    },
    async signOut(message) {
      if ("token" in message && message.token?.id) {
        await logAuditEvent({
          userId: message.token.id as string,
          action: "AUTH_LOGOUT",
        });
      }
    },
  },
});
