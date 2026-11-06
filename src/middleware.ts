import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/rooms",
  "/proctored-test",
  "/test",
  "/settings",
  "/onboarding",
];

const ADMIN_PREFIX = "/admin";
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isEmailVerified = Boolean((req.auth?.user as any)?.emailVerified);
  const isOnboardingComplete = Boolean((req.auth?.user as any)?.onboardingComplete);
  const role = (req.auth?.user as any)?.role as Role | undefined;
  const pathname = nextUrl.pathname;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // 1. Admin routes: Conceal existence with 404 for non-admins
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    }
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    if (!isAdmin) {
      // Rewrite to not-found so non-admins get a 404
      return NextResponse.rewrite(new URL("/not-found", nextUrl));
    }
    return NextResponse.next();
  }

  // 2. If logged in and visiting an auth route (/login, /signup, etc.)
  if (isLoggedIn && isAuthRoute) {
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL("/verify-email-required", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 3. If logged out and visiting a protected route: redirect to /login with callbackUrl
  if (!isLoggedIn && isProtectedRoute) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // 4. If logged in but unverified: block all protected routes, redirect to /verify-email-required
  if (isLoggedIn && !isEmailVerified) {
    if (pathname === "/verify-email-required" || pathname === "/verify-email" || pathname === "/cancel-signup") {
      return NextResponse.next();
    }
    if (isProtectedRoute) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(new URL(`/verify-email-required?callbackUrl=${callbackUrl}`, nextUrl));
    }
  }

  // 5. If logged in & verified, never show /verify-email-required
  if (isLoggedIn && isEmailVerified && pathname === "/verify-email-required") {
    const callbackUrl = nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      return NextResponse.redirect(new URL(decodeURIComponent(callbackUrl), nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 6. If logged in, email verified, onboarding is incomplete, and visiting protected pages (excluding /onboarding itself)
  if (isLoggedIn && isEmailVerified && !isOnboardingComplete && pathname !== "/onboarding" && isProtectedRoute) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
