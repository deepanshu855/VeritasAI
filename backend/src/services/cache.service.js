import { getRedis } from "../config/redis.config.js";

// Returns the saved object, or null (no note / Redis down / error)
const getCached = async (key) => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const text = await redis.get(key);
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.log("[cache] get failed:", err.message);
    return null;
  }
};

// Saves the object for ttlSeconds. Returns true if saved, false if not.
const setCached = async (key, value, ttlSeconds) => {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch (err) {
    console.log("[cache] set failed:", err.message);
    return false;
  }
};

export { getCached, setCached };