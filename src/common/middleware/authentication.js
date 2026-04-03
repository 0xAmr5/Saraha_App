import { VerifyToken } from "../utils/token.service.js";
import userModel from "../../DB/models/user.model.js";
import { PREFIX, ACCESS_SECRET_KEY } from "../../../config/config.service.js";
import { get, revoked_key } from "../../DB/redis/redis.service.js";

export const authentication = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        
        // 1. التأكد من وجود الـ Header
        if (!authorization) {
            return next(new Error("Token is required 🔴", { cause: 400 }));
        }

        // 2. فصل الـ Prefix عن الـ Token
        const [authPrefix, token] = authorization.split(" ");

        // 3. التأكد من صحة الـ Prefix (Amr)
        if (authPrefix !== PREFIX) {
            return next(new Error("Invalid token prefix ❌", { cause: 400 }));
        }

        // 4. التحقق من الـ Token وفك التشفير
        // استخدمت "Amr" مباشرة كـ Secret Key احتياطياً لو الـ Config فيه مشكلة
        const decoded = VerifyToken({
            token,
            secret_key: ACCESS_SECRET_KEY || "Amr", 
        });

        if (!decoded || !decoded?.id) {
            return next(new Error("Invalid token ❎", { cause: 400 }));
        }

        // 5. البحث عن المستخدم (استخدمنا findById مباشرة لضمان الوصول للـ _id)
        const user = await userModel.findById(decoded.id).select("-password");

        if (!user) {
            return next(new Error("User not found in database 🔍", { cause: 404 }));
        }

        // 6. التحقق من تاريخ تغيير البيانات (Security Check)
        if (user?.changeCredential?.getTime() / 1000 > decoded.iat) {
            return next(new Error("Token expired due to credential change, please login again", { cause: 401 }));
        }

        // 7. التحقق من الـ Redis (Revoked Tokens)
        // بنعمل catch عشان لو الـ Redis فاصل السيرفر ميعملش Crash ويكمل عادي
        const isRevoked = await get(
            revoked_key({ userId: decoded.id, jti: decoded.jti })
        ).catch(() => null);

        if (isRevoked) {
            return next(new Error("Token revoked ❎", { cause: 401 }));
        }

        // 8. تمرير بيانات المستخدم والـ decoded للـ request
        req.user = user;
        req.decoded = decoded;
        
        next();
    } catch (error) {
        // لو حصل أي Error في الـ JWT (زي إنه منتهي الصلاحية) هينزل هنا
        return next(new Error(error.message, { cause: 500 }));
    }
};