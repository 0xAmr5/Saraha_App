import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js"; 
import { validation } from "../../common/middleware/validation.js";
import { multer_local } from "../../common/middleware/multer.js";
import { multerEnum } from "../../common/enum/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.js";

const userRouter = Router();

// SignUp
userRouter.post("/signup", 
    multer_local({ custom_types: [...multerEnum.image] }).fields([{ name: "attachments", maxCount: 5 }]),
    validation(UV.signUpSchema), 
    US.signUp 
);

// SignIn
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);

// Forget Password
userRouter.post("/forget-password", US.forgetPassword);
userRouter.patch("/reset-password", US.resetPassword);

// 2FA
userRouter.patch("/enable-2fa", authentication, US.enable2FA);
userRouter.patch("/confirm-2fa", authentication, US.confirm2FA);

export default userRouter;