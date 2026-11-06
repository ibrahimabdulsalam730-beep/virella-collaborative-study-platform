interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up entries older than 30 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 30 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitOptions {
  limit?: number; // max allowed attempts
  windowMs?: number; // window size in milliseconds
}

/**
 * Check and record a rate limit attempt.
 * Default: 5 attempts per 15 minutes (900,000 ms).
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
  message?: string;
} {
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const now = Date.now();

  const record = rateLimitStore.get(key) ?? { timestamps: [] };

  // Retain only timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    const minutes = Math.ceil(resetInSeconds / 60);

    return {
      success: false,
      remaining: 0,
      resetInSeconds,
      message: `Too many attempts. For your security, please wait ${minutes} minute${
        minutes > 1 ? "s" : ""
      } before trying again.`,
    };
  }

  record.timestamps.push(now);
  rateLimitStore.set(key, record);

  const resetInSeconds = Math.ceil(windowMs / 1000);
  return {
    success: true,
    remaining: limit - record.timestamps.length,
    resetInSeconds,
  };
}

/**
 * Reset rate limit key upon successful authentication
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}
