const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Virella Study <noreply@virellastudy.com>";

interface SendVerificationEmailOptions {
  email: string;
  name?: string | null;
  token: string;
  callbackUrl?: string;
}

interface SendPasswordResetEmailOptions {
  email: string;
  token: string;
}

/**
 * Print developer-friendly console link box for testing without third-party email setup.
 */
function logDevEmailBox(title: string, to: string, links: { label: string; url: string }[]) {
  console.log("\n" + "=".repeat(76));
  console.log(`[VIRELLA DEV EMAIL DISPATCHER] ${title}`);
  console.log(`To:   ${to}`);
  for (const item of links) {
    console.log(`${item.label.padEnd(14)}: ${item.url}`);
  }
  console.log("=".repeat(76) + "\n");
}

/**
 * Send an email verification link.
 * Falls back to terminal console in development if no API key is supplied.
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
  callbackUrl,
}: SendVerificationEmailOptions): Promise<{ success: boolean; devLink?: string; cancelLink?: string }> {
  const verifyParams = new URLSearchParams({
    token,
    email,
    ...(callbackUrl ? { callbackUrl } : {}),
  });
  const cancelParams = new URLSearchParams({
    token,
    email,
  });

  const verifyUrl = `${APP_URL}/verify-email?${verifyParams.toString()}`;
  const cancelUrl = `${APP_URL}/cancel-signup?${cancelParams.toString()}`;

  const plainText = [
    `Welcome to Virella Study${name ? `, ${name}` : ""}!`,
    "",
    "Please confirm your email address to unlock live study rooms, collaborative whiteboards, and peer focus:",
    verifyUrl,
    "",
    "This link is valid for 24 hours.",
    "",
    "Did not sign up? If this wasn't you, click below to completely cancel and remove this account:",
    cancelUrl,
  ].join("\n");

  // Dev logger (always available in development for seamless zero-setup testing)
  if (!RESEND_API_KEY) {
    logDevEmailBox("CONFIRM YOUR EMAIL ADDRESS", email, [
      { label: "Confirm Link", url: verifyUrl },
      { label: "Cancel Link", url: cancelUrl },
    ]);
    return { success: true, devLink: verifyUrl, cancelLink: cancelUrl };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: "Confirm your email — Virella Study",
        text: plainText,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #05050a; color: #f8fafc; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="margin-bottom: 24px; text-align: center;">
              <span style="font-size: 20px; font-weight: bold; color: #ffffff;">Virella <span style="color: #b4f000; font-family: monospace; font-size: 13px;">[STUDY]</span></span>
            </div>
            <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 16px; color: #ffffff; text-align: center;">Confirm your email address</h1>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px; text-align: center;">
              Welcome to Virella Study${name ? `, ${name}` : ""}! Please verify your email to access synchronized rooms, live audiovisual collaboration, and interactive study telemetry.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="background-color: #b4f000; color: #05050a; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(180, 240, 0, 0.3);">
                Confirm my email →
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center;">
              This confirmation link is single-use and expires in 24 hours.<br />
              <span style="display: inline-block; margin-top: 10px;">
                Didn't request this? <a href="${cancelUrl}" style="color: #f43f5e; text-decoration: underline;">This wasn't me (delete account)</a>
              </span>
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      logDevEmailBox("CONFIRM EMAIL (FALLBACK CONSOLE)", email, [
        { label: "Confirm Link", url: verifyUrl },
        { label: "Cancel Link", url: cancelUrl },
      ]);
      return { success: false, devLink: verifyUrl, cancelLink: cancelUrl };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to dispatch verification email:", error);
    logDevEmailBox("CONFIRM EMAIL (FALLBACK CONSOLE)", email, [
      { label: "Confirm Link", url: verifyUrl },
      { label: "Cancel Link", url: cancelUrl },
    ]);
    return { success: false, devLink: verifyUrl, cancelLink: cancelUrl };
  }
}

/**
 * Send a password reset link.
 * Token expires in 1 hour.
 */
export async function sendPasswordResetEmail({
  email,
  token,
}: SendPasswordResetEmailOptions): Promise<{ success: boolean; devLink?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (!RESEND_API_KEY) {
    logDevEmailBox("PASSWORD RESET LINK", email, [{ label: "Reset Link", url: resetUrl }]);
    return { success: true, devLink: resetUrl };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: "Reset your password — Virella Study",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #05050a; color: #f8fafc; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="margin-bottom: 24px; text-align: center;">
              <span style="font-size: 20px; font-weight: bold; color: #ffffff;">Virella <span style="color: #b4f000; font-family: monospace; font-size: 13px;">[STUDY]</span></span>
            </div>
            <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 16px; color: #ffffff;">Password Reset Request</h1>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px;">
              We received a request to reset the password for your Virella Study account. Click below to set a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #b4f000; color: #05050a; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
                Reset Password →
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
              This link is single-use and expires in 1 hour. If you did not request a password reset, no action is needed.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      logDevEmailBox("PASSWORD RESET (FALLBACK CONSOLE)", email, [{ label: "Reset Link", url: resetUrl }]);
      return { success: false, devLink: resetUrl };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to dispatch reset email:", error);
    logDevEmailBox("PASSWORD RESET (FALLBACK CONSOLE)", email, [{ label: "Reset Link", url: resetUrl }]);
    return { success: false, devLink: resetUrl };
  }
}
