import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import reModel from "../../DB/models/revokeToken.model.js";
 export const authentication = async (req, res, next) => {
    if (prefix !== PREFIX) {
        throw new Error("Invalid toden prefix");
    }

    const decoded = verifyToken({
        token,
        secret_key: "secretKey",
    });

    if (!decoded || !decoded?.id) {
        throw new Error("Invalid token");
    }

    const user = await db_service.findOne({
        model: userModel,
        id: decoded.id,
        select: "-password",
    });

    if (!user) {
        throw new Error("user not exist", { cause: 400 });
    }

    if (user?.changeCredential?.getTime() > decoded.iat) {
        throw new Error("token expired");
    }

    const revokeToken = await get(
        revoked_key({ userId: decoded.id, jti: decoded.jti }),
    );

    if (revokeToken) {
        throw new Error("Invalid token revoked");
    }

    req.user = user;
    req.req_decoded = decoded;
    next();
};