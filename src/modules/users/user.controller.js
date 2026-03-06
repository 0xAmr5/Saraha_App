import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js"; 
import { validation } from "../../common/middleware/validation.js";import { multer_local } from "../../common/middleware/multer.js";
import { multerEnum } from "../../common/enum/multer.enum.js";

const userRouter = Router();

// 1. SignUp مع Validation
userRouter.post("/signup", 
    multer_local({ custom_types: [...multerEnum.image] }).fields([{ name: "attachments", maxCount: 5 }]),
    validation(UV.signUpSchema), 
    US.signUp
);

// 2. SignIn مع Validation
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);

// 3. Confirm Email مع Validation
userRouter.post("/confirm", validation(UV.confirmEmailSchema), US.confirmEmail);

// 4. Login With Gmail
userRouter.post("/signup", 
    multer_local({ custom_types: [...multerEnum.image] }).fields([{ name: "attachments", maxCount: 5 }]),
    validation(UV.signUpSchema), 
    US.signUp
);
export default userRouter;