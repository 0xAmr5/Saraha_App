const messageRouter = Router();

// إرسال رسالة (مفتوح للجميع بس بحد أقصى 3 صور)
messageRouter.post("/send",
    multer_local({
        custom_path: "messages",
        custom_types: multer_enum.image
    }).array("attachments", 3),
    validation(MV.sendMessageSchema),
    MS.sendMessage
);

// قراءة كل الرسائل (محتاج تسجيل دخول)
messageRouter.get("/",
    authentication,
    MS.getMessages
);

// قراءة رسالة محددة (محتاج تسجيل دخول وفالييشن للايدي)
messageRouter.get("/:messageId",
    authentication,
    validation(MV.getMessageSchema),
    MS.getMessage
);

export default messageRouter;