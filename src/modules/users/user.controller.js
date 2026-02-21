import { Router } from "express";
import * as userService from "./user.service.js"; 

const userRouter = Router();

userRouter.post("/signup", userService.signUp);
userRouter.patch("/confirm-email", userService.confirmEmail);
userRouter.post("/signin", userService.signIn);

export default userRouter;