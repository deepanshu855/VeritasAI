import Redis from "ioredis";

let redis = null;

const connectToRedis = () => {
  if (!process.env.REDIS_URL) {
    console.log("REDIS_URL not set, running without cache");
    return;
  }

  redis = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false, // if Redis is down, fail at once (do not make the chat wait)
    connectTimeout: 5000, // give up one connection try after 5 s
  });

  redis.on("ready", () => console.log("Redis connected!"));
  redis.on("error", (err) => console.log("Redis error ", err.message));
};

// Other files call this. It returns the connection only when it is ready.
const getRedis = () => (redis && redis.status === "ready" ? redis : null);

export { connectToRedis, getRedis };