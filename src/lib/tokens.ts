import crypto from "crypto";
import { prisma } from "./prisma";

/**
 * Hash raw token using SHA-256 before storing in the database.
 * This guarantees database breaches cannot expose valid login/reset tokens.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a 32-byte cryptographically secure random token string.
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a verification token for email confirmation (valid 24h).
 * Deletes any existing pending tokens for this email and stores the new hashed token.
 */
export async function createEmailVerificationToken(email: string) {
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Clean up any old tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase() },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token: tokenHash,
      expires,
    },
  });

  return { rawToken, expires };
}

/**
 * Auto-delete unverified accounts older than 7 days.
 */
export async function cleanupUnverifiedAccounts() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        emailVerified: null,
        createdAt: { lt: sevenDaysAgo },
      },
    });
    if (deleted.count > 0) {
      console.log(`[Auto-cleanup] Purged ${deleted.count} stale unverified account(s) older than 7 days.`);
    }
  } catch (err) {
    console.error("[Auto-cleanup error]:", err);
  }
}

/**
 * Cancel and delete an unverified account via "This wasn't me" link.
 */
export async function cancelUnverifiedAccount(email: string, rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const normalizedEmail = email.toLowerCase().trim();

  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      token: tokenHash,
    },
  });

  if (!tokenRecord) {
    return { success: false, reason: "invalid_or_expired" as const };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { success: false, reason: "not_found" as const };
  }

  // Only delete if still unverified
  if (user.emailVerified) {
    return { success: false, reason: "already_verified" as const };
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  await prisma.user.delete({
    where: { id: user.id },
  });

  return { success: true };
}

/**
 * Verify email verification token (single use).
 */
export async function verifyEmailVerificationToken(email: string, rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token: tokenHash,
    },
  });

  if (!existingToken) {
    return { valid: false, reason: "invalid" as const };
  }

  if (new Date() > existingToken.expires) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });
    return { valid: false, reason: "expired" as const };
  }

  // Delete token upon successful verification (single-use)
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: existingToken.identifier,
        token: existingToken.token,
      },
    },
  });

  return { valid: true };
}

/**
 * Generate a password reset token (valid 1 hour, single use).
 */
export async function createPasswordResetToken(email: string) {
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Remove existing reset tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email: email.toLowerCase() },
  });

  await prisma.passwordResetToken.create({
    data: {
      email: email.toLowerCase(),
      token: tokenHash,
      expires,
    },
  });

  return { rawToken, expires };
}

/**
 * Verify password reset token (single use).
 */
export async function verifyPasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const existingToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });

  if (!existingToken) {
    return { valid: false, reason: "invalid" as const, email: null };
  }

  if (new Date() > existingToken.expires) {
    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    });
    return { valid: false, reason: "expired" as const, email: null };
  }

  return { valid: true, email: existingToken.email, tokenId: existingToken.id };
}
