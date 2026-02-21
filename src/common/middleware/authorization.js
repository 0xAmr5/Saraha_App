export const authorization = (allowedRole = []) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new Error("Unauthenticated 🔴", { cause: 400 });
        }
        
        if (!allowedRole.includes(req.user.role)) {
            throw new Error("Unauthorized ❌", { cause: 401 });
        }
        
        next(); 
    };
};