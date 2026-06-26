interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries to prevent memory leaks in long-running processes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      // Keep timestamps up to 10 minutes (600,000ms), which is the maximum window size used in signup
      const validTimestamps = record.timestamps.filter((t) => now - t < 600000);
      if (validTimestamps.length === 0) {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, { timestamps: validTimestamps });
      }
    }
  }, 60000);
}

export function rateLimit(ip: string, limit = 60, windowMs = 60000, prefix = "") {
  const now = Date.now();
  const key = prefix ? `${prefix}:${ip}` : ip;
  let record = memoryStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Keep only timestamps within the sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const requestCount = record.timestamps.length;
  const isRateLimited = requestCount >= limit;
  const remaining = Math.max(0, limit - requestCount);

  // Reset time is when the oldest request exits the window
  const oldestTimestamp = record.timestamps[0] || now;
  const resetTime = Math.ceil((oldestTimestamp + windowMs) / 1000);

  if (!isRateLimited) {
    record.timestamps.push(now);
  }

  return {
    isRateLimited,
    limit,
    remaining: isRateLimited ? 0 : Math.max(0, remaining - 1),
    resetTime,
  };
}
