import bcrypt from 'bcrypt';

export const Hash = ({ plain_text, salt = 8 } = {}) => {
    return bcrypt.hashSync(plain_text, salt);
};

export const Compare = ({ plain_text, cipher_text } = {}) => {
    return bcrypt.compareSync(plain_text, cipher_text);
};