import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/",
    // Route /login?error=... for all OAuth errors, including user-cancelled Google login.
    // The login page reads ?error= and ?google_cancelled= to show friendly messages.
    error: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for persistent logins
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "STUDENT";
        token.status = (user as any).status || "ACTIVE";
        token.onboardingComplete = Boolean((user as any).onboardingComplete);
        token.emailVerified = Boolean((user as any).emailVerified);
        token.picture = user.image || null;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
        if (session.role) token.role = session.role;
        if (session.status) token.status = session.status;
        if (session.onboardingComplete !== undefined) {
          token.onboardingComplete = session.onboardingComplete;
        }
        if (session.emailVerified !== undefined) {
          token.emailVerified = session.emailVerified;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        session.user.role = ((token.role as string) || "STUDENT") as any;
        session.user.status = ((token.status as string) || "ACTIVE") as any;
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
        (session.user as any).emailVerified = Boolean(token.emailVerified);
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
    // Route OAuth errors cleanly so the user never sees a raw error page.
    // OAuthCallbackError / AccessDenied = user closed the Google popup or denied.
    // We redirect to /login?google_cancelled=1 instead of /login?error=OAuthCallbackError.
    redirect({ url, baseUrl }) {
      // Decode the URL to check error parameters
      try {
        const parsed = new URL(url, baseUrl);
        const error = parsed.searchParams.get("error");
        if (
          error === "OAuthCallbackError" ||
          error === "AccessDenied" ||
          error === "OAuthSignin"
        ) {
          return `${baseUrl}/login?google_cancelled=1`;
        }
      } catch {
        // Not a parseable URL, fall through to default behaviour
      }
      // Allow absolute URLs on the same origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  providers: [], // Configured with full providers in src/auth.ts
};
