"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
  changePasswordSchema,
  updateProfileSchema,
  type SignupInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OnboardingInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/lib/validations/auth";
import {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  cleanupUnverifiedAccounts,
  cancelUnverifiedAccount,
} from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { getCurrentUser, requireUser } from "@/lib/session";
import { headers } from "next/headers";
import { AuthError } from "next-auth";

/**
 * Helper to extract client IP address from server headers for rate-limiting.
 */
async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return (
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}

/**
 * 1. SIGNUP ACTION
 */
export async function signupAction(formData: unknown) {
  const ip = await getClientIp();

  // Rate limit signup: max 5 attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(`signup:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.success) {
    return {
      success: false,
      error: rateLimit.message || "Too many signup attempts. Please try again later.",
    };
  }

  const parsed = signupSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input data",
    };
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    if (existingUser.passwordHash) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    } else {
      // User created account via Google OAuth previously
      return {
        success: false,
        error: "This email is registered with Google. Please continue with Google.",
      };
    }
  }

  // Hash password securely with bcrypt (12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      emailVerified: null,
      onboardingComplete: false,
    },
  });

  // Generate verification token and send verification email
  const { rawToken } = await createEmailVerificationToken(normalizedEmail);
  const emailResult = await sendVerificationEmail({
    email: normalizedEmail,
    name,
    token: rawToken,
    callbackUrl: (formData as any)?.callbackUrl,
  });

  // Background sweep of old unverified accounts (> 7 days)
  cleanupUnverifiedAccounts().catch(console.error);

  await logAuditEvent({
    userId: newUser.id,
    action: "AUTH_SIGNUP",
    metadata: { email: normalizedEmail, role },
  });

  return {
    success: true,
    email: normalizedEmail,
    devLink: emailResult.devLink,
    cancelLink: emailResult.cancelLink,
  };
}

/**
 * 2. LOGIN ACTION
 */
export async function loginAction(
  formData: unknown
): Promise<{ success: boolean; error?: string; email?: string }> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid credentials",
    };
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.cause?.err?.message || "Invalid email or password",
      };
    }
    const msg = error instanceof Error ? error.message : "Invalid email or password";
    return { success: false, error: msg || "Invalid email or password" };
  }
}

/**
 * 3. RESEND VERIFICATION EMAIL ACTION
 * Rate limited to max 5 emails per hour per account.
 * Never reveals whether an email is registered.
 */
export async function resendVerificationAction(email: string, callbackUrl?: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit: max 5 emails per hour per account
  const rateLimit = checkRateLimit(`resend:${normalizedEmail}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.success) {
    return {
      success: false,
      error: rateLimit.message || "Too many verification requests. Please wait before requesting another.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration, but only send if unverified user exists
    if (user && !user.emailVerified) {
      const { rawToken } = await createEmailVerificationToken(normalizedEmail);
      const emailResult = await sendVerificationEmail({
        email: normalizedEmail,
        name: user.name,
        token: rawToken,
        callbackUrl,
      });
      return { success: true, devLink: emailResult.devLink, cancelLink: emailResult.cancelLink };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Resend verification database error:", err);
    if (err?.message?.includes("localhost:5432") || err?.code === "P1001") {
      return {
        success: false,
        error: "Database offline: PostgreSQL is not running at localhost:5432. Please start Docker Desktop.",
      };
    }
    return {
      success: false,
      error: "Unable to reach database. Please ensure PostgreSQL is running.",
    };
  }
}

/**
 * 4. VERIFY EMAIL TOKEN ACTION
 */
export async function verifyEmailAction(email: string, token: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await verifyEmailVerificationToken(normalizedEmail, token);
  if (!result.valid) {
    return {
      success: false,
      reason: result.reason,
    };
  }

  // Update user as verified
  const isSuperAdminEmail =
    Boolean(process.env.SUPER_ADMIN_EMAIL) &&
    normalizedEmail === process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

  const user = await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      emailVerified: new Date(),
      ...(isSuperAdminEmail ? { role: "SUPER_ADMIN" } : {}),
    },
  });

  // Clean up any stale unverified accounts
  cleanupUnverifiedAccounts().catch(console.error);

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_EMAIL_VERIFIED",
    metadata: { email: normalizedEmail },
  });

  return { success: true };
}

/**
 * 5. CANCEL SIGNUP ACTION ("This wasn't me")
 * Completely removes the unverified user and invalidates the token.
 */
export async function cancelSignupAction(email: string, token: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await cancelUnverifiedAccount(normalizedEmail, token);
  if (!result.success) {
    return { success: false, reason: result.reason };
  }

  await logAuditEvent({
    action: "AUTH_SIGNUP_CANCELLED",
    metadata: { email: normalizedEmail },
  });

  return { success: true };
}

/**
 * 5. FORGOT PASSWORD ACTION
 */
export async function forgotPasswordAction(formData: unknown) {
  const ip = await getClientIp();

  const rateLimit = checkRateLimit(`forgot-pwd:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.success) {
    return {
      success: false,
      error: rateLimit.message || "Too many password reset requests. Please try again later.",
    };
  }

  const parsed = forgotPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid email address",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  let devLink: string | undefined;

  // If user exists and has a password, send reset token
  if (user && user.passwordHash) {
    const { rawToken } = await createPasswordResetToken(normalizedEmail);
    const emailRes = await sendPasswordResetEmail({
      email: normalizedEmail,
      token: rawToken,
    });
    devLink = emailRes.devLink;

    await logAuditEvent({
      userId: user.id,
      action: "AUTH_PASSWORD_RESET_REQUEST",
      metadata: { email: normalizedEmail },
    });
  }

  // Always return success to protect privacy
  return {
    success: true,
    message: "If an account exists with this email, we have sent a password reset link.",
    devLink,
  };
}

/**
 * 6. RESET PASSWORD ACTION
 */
export async function resetPasswordAction(rawToken: string, formData: unknown) {
  const parsed = resetPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid password",
    };
  }

  const tokenVerification = await verifyPasswordResetToken(rawToken);
  if (!tokenVerification.valid || !tokenVerification.email) {
    return {
      success: false,
      error:
        tokenVerification.reason === "expired"
          ? "This password reset link has expired. Please request a new one."
          : "Invalid or already used password reset link.",
    };
  }

  const email = tokenVerification.email;
  const newHash = await bcrypt.hash(parsed.data.password, 12);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      passwordHash: newHash,
      emailVerified: new Date(), // Resetting password also confirms email ownership
    },
  });

  // Consume/delete the reset token
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  await logAuditEvent({
    userId: updatedUser.id,
    action: "AUTH_PASSWORD_RESET_SUCCESS",
    metadata: { email },
  });

  return { success: true };
}

/**
 * 7. COMPLETE ONBOARDING ACTION
 */
export async function completeOnboardingAction(formData: unknown) {
  const user = await requireUser("/onboarding");

  const parsed = onboardingSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid onboarding selection",
    };
  }

  const { name, avatar, studyGoals, subjects } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      image: avatar || user.image,
      studyGoals,
      subjects,
      onboardingComplete: true,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "USER_ONBOARDING_COMPLETED",
    metadata: { studyGoals, subjects },
  });

  return { success: true };
}

/**
 * 8. CHANGE PASSWORD (FROM SETTINGS)
 */
export async function changePasswordAction(formData: unknown) {
  const user = await requireUser("/settings/account");

  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.passwordHash) {
    return {
      success: false,
      error: "This account was registered using Google. Set up a password instead.",
    };
  }

  const matches = await bcrypt.compare(
    parsed.data.currentPassword,
    dbUser.passwordHash
  );

  if (!matches) {
    return {
      success: false,
      error: "Current password is incorrect.",
    };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_PASSWORD_CHANGE",
  });

  return { success: true };
}

/**
 * 9. UPDATE PROFILE (FROM SETTINGS)
 */
export async function updateProfileAction(formData: unknown) {
  const user = await requireUser("/settings/account");

  const parsed = updateProfileSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid name",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.image ? { image: parsed.data.image } : {}),
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "USER_PROFILE_UPDATED",
  });

  return { success: true };
}

/**
 * 10. DELETE ACCOUNT ACTION
 */
export async function deleteAccountAction() {
  const user = await requireUser("/settings/account");

  await logAuditEvent({
    userId: user.id,
    action: "AUTH_ACCOUNT_DELETED",
  });

  await prisma.user.delete({
    where: { id: user.id },
  });

  await signOut({ redirectTo: "/" });
  return { success: true };
}

/**
 * 11. LOGOUT ACTION
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
