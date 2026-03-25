import { redisClient } from "./redis.db.js";

// 1. إضافة دوال توليد المفاتيح (مهمة جداً للـ Logout)
export const get_key = (userId) => `profile::${userId}`;
export const revoked_key = ({ userId, jti }) => `revoked_key:${userId}:${jti}`;

// 2. تعديل اسم الدالة لـ setValue بدل set عشان تطابق الـ import
export const setValue = async ({ key, value, ttl }) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        return ttl 
            ? await redisClient.set(key, data, { EX: ttl }) 
            : await redisClient.set(key, data);
    } catch (error) {
        console.log("error to set data in redis", error);
    }
};

// 3. باقي الدوال زي ما هي مع التأكد من الـ export
export const update = async ({ key, value = {} }) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        if (!(await redisClient.exists(key))) return 0;
        return await redisClient.set(key, data);
    } catch (error) {
        console.log("error to update data in redis", error);
    }
};

export const get = async (key) => {
    try {
        const data = await redisClient.get(key);
        try {
            return JSON.parse(data);
        } catch (error) {
            return data;
        }
    } catch (error) {
        console.log("error to get data in redis", error);
    }
};

export const deleteKey = async (key) => {
    try {
        if (!key || !key.length) return 0;
        return await redisClient.del(key);
    } catch (error) {
        console.log("error to delete data in redis", error);
    }
};

export const keys = async (pattern = "*") => {
    try {
        return await redisClient.keys(`${pattern}`);
    } catch (error) {
        console.log("error to get keys from redis", error);
    }
};