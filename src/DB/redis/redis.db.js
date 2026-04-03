import { createClient } from "redis";

export const redisClient = createClient({
    url: "rediss://default:gQAAAAAAQZPAAIncDI3ZGQzNjI0MDRkM0MwRWRmOGNlODMwNTg4@TgZNjFjM.redis.cache.windows.net:6380"
});

export const redisConnection = async () => {
    try {
       await redisClient.connect()
    .then(() => console.log("Redis Connected Successfully... 🚀"))
    .catch((err) => console.error("Redis Connection Error ❌", err));   
    } catch (error) {
        console.log("Fail to connect with redis", error);
    }
};
