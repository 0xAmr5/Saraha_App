import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";

export const authentication = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        throw new Error("Token is required 🔴", { cause: 400 });
    }

    const decoded = VerifyToken({ 
        token: authorization, 
        secret_key: "Amr" 
    });

    if (!decoded || !decoded.id) {
        throw new Error("Invalid token ❌", { cause: 400 });
    }

    const user = await db_service.findById({
        model: userModel,
        id: decoded.id,
        options: { select: "-password" }
    });

    if (!user) {
        throw new Error("User not found 🔴", { cause: 404 });
    }

    req.user = user;
    next();
};

