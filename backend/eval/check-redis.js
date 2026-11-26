// backend/eval/check-redis.js  (NEW FILE, throwaway test)
import Redis from "ioredis";

const url = process.env.REDIS_URL;
if (!url) {
  console.error("REDIS_URL is missing in .env");
  process.exit(1);
}

// Print only the host part, never the password
console.log("Connecting to host:", new URL(url).host);

const redis = new Redis(url, {
  maxRetriesPerRequest: 1, // fail fast instead of hanging
  retryStrategy: () => null, // do not keep reconnecting in this test
});

redis.on("error", (err) => console.error("Redis error:", err.message));

try {
  console.log("PING ->", await redis.ping());

  await redis.set("veritas:test", "hello cache", "EX", 30); // expires in 30 s
  console.log("GET  ->", await redis.get("veritas:test"));
  console.log("TTL  ->", await redis.ttl("veritas:test"), "seconds left");

  await redis.del("veritas:test");
  console.log("GET after delete ->", await redis.get("veritas:test"));
} catch (err) {
  console.error("TEST FAILED:", err.message);
} finally {
  redis.disconnect();
}