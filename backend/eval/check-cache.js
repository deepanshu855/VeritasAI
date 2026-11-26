import { connectToRedis, getRedis } from "../src/config/redis.config.js";
import { getCached, setCached } from "../src/services/cache.service.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (name, ok) => console.log(ok ? "PASS" : "FAIL", "-", name);

connectToRedis();

// wait up to 5 s until Redis is ready
for (let i = 0; i < 50 && !getRedis(); i++) await sleep(100);
if (!getRedis()) {
  console.log("Redis never became ready, stopping");
  process.exit(1);
}

const key = "veritas:cachetest:1";
const sample = { results: [{ title: "SQL", url: "https://example.com" }], n: 1 };

// 1. round trip
check("setCached returns true", (await setCached(key, sample, 30)) === true);
const back = await getCached(key);
check("round trip gives the same object", JSON.stringify(back) === JSON.stringify(sample));

// 2. missing note
check("missing key returns null", (await getCached("veritas:cachetest:nope")) === null);

// 3. expiry timer is set
const ttl = await getRedis().ttl(key);
check(`TTL is set (got ${ttl} s)`, ttl > 0 && ttl <= 30);

// 4. bad data does not crash
await getRedis().set("veritas:cachetest:bad", "{not json");
check("broken saved text returns null", (await getCached("veritas:cachetest:bad")) === null);
const circular = {};
circular.self = circular;
check("object that cannot be saved returns false", (await setCached("veritas:cachetest:circ", circular, 30)) === false);

// clean up our test keys
await getRedis().del(key, "veritas:cachetest:bad");

// 5. Redis down
getRedis().disconnect();
check("Redis down: getCached returns null", (await getCached(key)) === null);
check("Redis down: setCached returns false", (await setCached(key, sample, 30)) === false);

process.exit(0);