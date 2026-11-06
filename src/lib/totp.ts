import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

export function generateTotpSecret(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "Virella Study Admin",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  });

  const uri = totp.toString();
  return {
    secret: secret.base32,
    uri,
  };
}

export async function generateQrCode(uri: string): Promise<string> {
  return await QRCode.toDataURL(uri, {
    margin: 2,
    width: 200,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

export function verifyTotpToken(token: string, secretBase32: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: "Virella Study Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: token.trim(), window: 1 });
  return delta !== null;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}
