import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", ()=>{
    console.log("Server connected to redis")
})

redis.on("error", (err)=>{
    console.log("Redis error: ", err)
})
