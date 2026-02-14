import CryptoJS from 'crypto-js';

export const encrypt = ({ plain_text, secret_key = "mohamed" } = {}) => {
    return CryptoJS.AES.encrypt(plain_text, secret_key).toString();
};

export const decrypt = ({ cipher_text, secret_key = "mohamed" } = {}) => {
    return CryptoJS.AES.decrypt(cipher_text, secret_key).toString(CryptoJS.enc.Utf8);
};