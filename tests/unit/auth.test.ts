import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
  changePasswordSchema,
} from "../../src/lib/validations/auth";
import { checkRateLimit, resetRateLimit } from "../../src/lib/rate-limit";

describe("Authentication Validation Tests", () => {
  describe("signupSchema", () => {
    it("should accept valid student signup data", () => {
      const valid = {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "STUDENT" as const,
        agreeToTerms: true,
      };
      const result = signupSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it("should reject password without uppercase letter", () => {
      const invalid = {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123!",
        confirmPassword: "password123!",
        role: "STUDENT" as const,
        agreeToTerms: true,
      };
      const result = signupSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("uppercase")));
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const invalid = {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Pass1!",
        confirmPassword: "Pass1!",
        role: "STUDENT" as const,
        agreeToTerms: true,
      };
      const result = signupSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("at least 8 characters")));
      }
    });

    it("should reject mismatched confirmPassword", () => {
      const invalid = {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
        role: "STUDENT" as const,
        agreeToTerms: true,
      };
      const result = signupSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("do not match")));
      }
    });

    it("should reject unaccepted terms and conditions", () => {
      const invalid = {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "INSTRUCTOR" as const,
        agreeToTerms: false,
      };
      const result = signupSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.length > 0);
      }
    });
  });

  describe("loginSchema", () => {
    it("should accept valid email and password with remember me", () => {
      const valid = {
        email: "user@domain.com",
        password: "any-password-string",
        rememberMe: true,
      };
      const result = loginSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it("should reject invalid email format", () => {
      const invalid = {
        email: "not-an-email",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("valid email")));
      }
    });
  });

  describe("resetPasswordSchema", () => {
    it("should reject when new passwords do not match", () => {
      const invalid = {
        token: "sample-token",
        password: "Password123!",
        confirmPassword: "Password456!",
      };
      const result = resetPasswordSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("do not match")));
      }
    });
  });

  describe("onboardingSchema", () => {
    it("should enforce at least one study goal and subject", () => {
      const valid = {
        name: "Nikola Tesla",
        studyGoals: ["Deep Work"],
        subjects: ["Physics"],
      };
      const result = onboardingSchema.safeParse(valid);
      assert.equal(result.success, true);

      const invalid = {
        name: "Nikola Tesla",
        studyGoals: [],
        subjects: [],
      };
      const resultInvalid = onboardingSchema.safeParse(invalid);
      assert.equal(resultInvalid.success, false);
    });
  });
});

describe("Rate Limiting Security Tests", () => {
  it("should permit attempts under the limit and block once exceeded", () => {
    const key = `test-ip-${Date.now()}`;
    const opts = { limit: 3, windowMs: 60 * 1000 };

    resetRateLimit(key);

    const r1 = checkRateLimit(key, opts);
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(key, opts);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(key, opts);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);

    const r4 = checkRateLimit(key, opts);
    assert.equal(r4.success, false);
    assert.ok(r4.message?.includes("Too many attempts"));
  });
});

describe("Token Cryptographic Logic Tests", () => {
  it("should generate cryptographically strong 32-byte hex tokens", () => {
    const rawToken1 = crypto.randomBytes(32).toString("hex");
    const rawToken2 = crypto.randomBytes(32).toString("hex");

    assert.equal(rawToken1.length, 64);
    assert.equal(rawToken2.length, 64);
    assert.notEqual(rawToken1, rawToken2);
  });

  it("should hash tokens deterministically using SHA-256 for secure DB storage", () => {
    const rawToken = "5f2b89f9a2ab391b5b82d28b88e20b507bb81e0d5d2c0d2635b1bb3e33250235";
    const hash1 = crypto.createHash("sha256").update(rawToken).digest("hex");
    const hash2 = crypto.createHash("sha256").update(rawToken).digest("hex");

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
    // Ensure raw token is not equal to hash
    assert.notEqual(rawToken, hash1);
  });
});
