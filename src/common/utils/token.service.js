import jwt from 'jsonwebtoken';

export const GenerateToken = ({ payload = {}, signature = "Amr", options = {} }) => {
    return jwt.sign(payload, signature, options);
};

export const VerifyToken = ({ token, secret_key, options = {} } = {}) => {
    return jwt.verify(token, secret_key, options);
};