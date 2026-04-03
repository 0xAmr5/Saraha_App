import dotenv from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";

let envPaths = {
    development: ".env.development",
    production: ".env.production"
};

// تحميل الملف الأول عشان الـ process.env تقرأ صح
dotenv.config({ path: resolve(`config/${envPaths[NODE_ENV]}`) });

// تأكد إن الأسماء دي هي اللي بتعملها Import في الملفات التانية
export const PORT = +process.env.PORT || 3000;
export const SALT_ROUNDS = +process.env.SALT_ROUNDS || 8;
export const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY || "Amr";
export const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;
export const SECRET_KEY = process.env.SECRET_KEY;
export const PREFIX = process.env.PREFIX || "Bearer";
export const AUDIENCE = process.env.AUDIENCE || "user";
export const DB_URI = process.env.DB_URI;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
export const ORIGINS = process.env.ORIGINS?.split(",") || [];
export const EXPIRES_TOKEN = 60 * 30; 