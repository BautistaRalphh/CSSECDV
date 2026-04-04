const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

function isHashedPassword(value) {
    return typeof value === 'string' && value.startsWith('scrypt$');
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
    if (!storedPassword) {
        return { isValid: false, needsUpgrade: false };
    }

    if (!isHashedPassword(storedPassword)) {
        return {
            isValid: password === storedPassword,
            needsUpgrade: password === storedPassword
        };
    }

    const [, salt, hashedValue] = storedPassword.split('$');
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);
    const hashedBuffer = Buffer.from(hashedValue, 'hex');
    const isValid =
        hashedBuffer.length === derivedKey.length &&
        crypto.timingSafeEqual(hashedBuffer, derivedKey);

    return { isValid, needsUpgrade: false };
}

module.exports = {
    hashPassword,
    verifyPassword,
    isHashedPassword
};
