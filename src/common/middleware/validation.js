export const validation = (schema) => {
    return (req, res, next) => {
        const dataToValidate = { ...req.body, ...req.params, ...req.query };

        const { error } = schema.validate(dataToValidate, { abortEarly: false });

        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            
            return res.status(400).json({
                message: "Validation Error 🔴",
                errors: errorMessages, 
                timestamp: new Date().toISOString() 
            });
        }

        next();
    };
};