// --- إرسال رسالة جديدة ---
export const sendMessage = async (req, res, next) => {
    const { content, userId } = req.body;

    // التأكد إن المستخدم المرسل إليه موجود
    const user = await db_service.findById({
        model: userModel,
        id: userId
    });

    if (!user) {
        throw new Error("user not exist");
    }

    // تجهيز المرفقات (Attachments) لو موجودة
    let arr = [];
    if (req.files?.length) {
        for (const file of req.files) {
            arr.push(file.path);
        }
    }

    // إنشاء الرسالة في الداتابيز
    const message = await db_service.create({
        model: messageModel,
        data: {
            content,
            userId: user._id,
            attachments: arr
        }
    });

    successResponse({ res, status: 201, data: message });
};

// --- قراءة رسالة واحدة (لصاحب الرسالة فقط) ---
export const getMessage = async (req, res, next) => {
    const { messageId } = req.params;

    const message = await db_service.findOne({
        model: messageModel,
        filter: {
            _id: messageId,
            userId: req.user._id // تأكد إن اللي بيقرأ هو صاحب الرسالة
        }
    });

    if (!message) {
        throw new Error("message not exist or not auth");
    }

    successResponse({ res, status: 200, data: message });
};

// --- قراءة كل الرسائل الخاصة بالمستخدم ---
export const getMessages = async (req, res, next) => {
    const messages = await db_service.find({
        model: messageModel,
        filter: {
            userId: req.user._id
        }
    });

    successResponse({ res, status: 200, data: messages });
};