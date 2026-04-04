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
    isHashedPassword,
    validatePassword
};

// Policy: min 12 chars, uppercase, lowercase, digit, special character
function validatePassword(password) {
    const errors = [];
    if (!password || password.length < 12)   errors.push("at least 12 characters long");
    if (!/[A-Z]/.test(password))             errors.push("at least one uppercase letter");
    if (!/[a-z]/.test(password))             errors.push("at least one lowercase letter");
    if (!/[0-9]/.test(password))             errors.push("at least one digit");
    if (!/[^A-Za-z0-9]/.test(password))      errors.push("at least one special character");
    return errors; // empty = valid
}
