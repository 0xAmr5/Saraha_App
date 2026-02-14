import { Router } from "express";
import * as US from "./user.service.js";

const userRouter = Router();

userRouter.post("/signUp", US.signUp);
userRouter.post("/signIn", US.signIn);

export default userRouter;