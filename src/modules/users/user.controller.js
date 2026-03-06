import { Router } from "express";
import * as US from "./user.service.js";
import { multer_local } from "../../common/middleware/multer.js";
import { multerEnum } from "../../common/enum/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/user.enum.js";

const userRouter = Router();

/**
 * 1. SignUp Route
 */
userRouter.post("/signup", 
    multer_local({
        custom_types: [...multerEnum.image, ...multerEnum.pdf]
    }).fields([
        { name: "attachments", maxCount: 5 } 
    ]), 
    US.signUp
);

/**
 * 2. SignIn Route
 */
userRouter.post("/signin", US.signIn);

userRouter.get("/profile", 
    authentication, 
    authorization([roleEnum.admin]), 
    US.getProfile
);

export default userRouter;