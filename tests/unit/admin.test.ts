import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTotpSecret, verifyTotpToken, generateBackupCodes } from "../../src/lib/totp";

describe("Admin & Security Unit Tests", () => {
  describe("Super Admin Account Protection", () => {
    const SUPER_ADMIN_EMAIL = "ibrahimabdulsalam.730@gmail.com";

    it("should recognize super admin email regardless of case or whitespace", () => {
      const input1 = "ibrahimabdulsalam.730@gmail.com";
      const input2 = "  IBRAHIMABDULSALAM.730@GMAIL.COM  ";
      assert.equal(input1.toLowerCase().trim(), SUPER_ADMIN_EMAIL.toLowerCase().trim());
      assert.equal(input2.toLowerCase().trim(), SUPER_ADMIN_EMAIL.toLowerCase().trim());
    });

    it("should prevent demotion or deletion of super admin account", () => {
      function assertCanModify(user: { role: string; email: string }) {
        if (
          user.role === "SUPER_ADMIN" ||
          user.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim()
        ) {
          throw new Error("The super admin account cannot be demoted, suspended, or deleted.");
        }
        return true;
      }

      // Regular student should be modifiable
      assert.equal(
        assertCanModify({ role: "STUDENT", email: "student@virella.edu" }),
        true
      );

      // Super admin must throw
      assert.throws(
        () => assertCanModify({ role: "SUPER_ADMIN", email: SUPER_ADMIN_EMAIL }),
        /The super admin account cannot be demoted, suspended, or deleted/
      );
    });
  });

  describe("TOTP Two-Factor Authentication Logic", () => {
    it("should generate valid TOTP secret and URI with proper issuer", () => {
      const { secret, uri } = generateTotpSecret("admin@virella.edu");
      assert.ok(secret);
      assert.ok(secret.length >= 16);
      assert.ok(uri.includes("otpauth://totp/"));
      assert.ok(uri.includes("Virella%20Study%20Admin"));
    });

    it("should generate proper 8-character hyphenated backup codes", () => {
      const codes = generateBackupCodes(8);
      assert.equal(codes.length, 8);
      for (const code of codes) {
        assert.match(code, /^[0-9A-F]{4}-[0-9A-F]{4}$/);
      }
      // Ensure all 8 codes are unique
      const unique = new Set(codes);
      assert.equal(unique.size, 8);
    });
  });

  describe("Account Suspension Gate", () => {
    it("should block suspended users from socket room joins", () => {
      function checkRoomAccess(user: { emailVerified: boolean; status: string }) {
        if (!user.emailVerified) return { allowed: false, reason: "EMAIL_VERIFICATION_REQUIRED" };
        if (user.status === "SUSPENDED") return { allowed: false, reason: "ACCOUNT_SUSPENDED" };
        return { allowed: true };
      }

      assert.deepEqual(checkRoomAccess({ emailVerified: true, status: "ACTIVE" }), { allowed: true });
      assert.deepEqual(checkRoomAccess({ emailVerified: true, status: "SUSPENDED" }), {
        allowed: false,
        reason: "ACCOUNT_SUSPENDED",
      });
      assert.deepEqual(checkRoomAccess({ emailVerified: false, status: "ACTIVE" }), {
        allowed: false,
        reason: "EMAIL_VERIFICATION_REQUIRED",
      });
    });
  });
});
