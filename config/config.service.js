import dotenv from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV;

let envPaths = {
    development: ".env.development",
    production: ".env.production"
};

dotenv.config({ path: resolve(`config/${envPaths[NODE_ENV]}`) });

export const PORT = +process.env.PORT;
export const SALT_ROUNDS = +process.env.SALT_ROUNDS;
export const SECRET_KEY = process.env.SECRET_KEY;
export const DB_URI = process.env.DB_URI;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
export const AUDIENCE = process.env.AUDIENCE;