import express from "express";
import cors from "cors"; // تأكد إنك عملت npm install cors
import checkConnectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import { ORIGINS } from "../config/config.service.js";
const bootstrap = (app) => {
    // 1. كود الـ CORS لازم يكون أول حاجة جوه الـ bootstrap
    const corsOptions = {
        origin: function (origin, callback) {
            // إضافة !origin عشان الـ Postman يشتغل معاك
            if (!origin || ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("not allowed by cors"));
            }
        }
    };

    app.use(cors(corsOptions));

    // 2. باقي الـ Middlewares
    app.use(express.json());

    checkConnectionDB();

    app.get("/", (req, res) => {
        res.status(200).json({ message: "Welcome on Saraha App 😍👋" });
    });

    // الـ Routes
    app.use("/users", userRouter);

    // الـ Not Found Handler
    app.all(/.*/, (req, res, next) => {
        return next(new Error(`URL ${req.originalUrl} not found ❌`, { cause: 404 }));
    });

    // الـ Global Error Handler
    app.use((err, req, res, next) => {
        const status = err.cause || 500;
        return res.status(status).json({ 
            message: err.message, 
            stack: err.stack 
        });
    });
};

export default bootstrap;