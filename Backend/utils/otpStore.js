/**
 * In-memory OTP store.
 * Key format: "<namespace>:<email>" so signup and password-reset OTPs don't collide.
 * For multi-instance deployments, swap with Redis.
 */
const store = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const generate = () => String(Math.floor(100000 + Math.random() * 900000));

const _key = (namespace, email) => `${namespace}:${email.toLowerCase()}`;

const set = (namespace, email, otp) => {
    store.set(_key(namespace, email), { otp, expiresAt: Date.now() + OTP_TTL_MS });
};

const verify = (namespace, email, otp) => {
    const entry = store.get(_key(namespace, email));
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) { store.delete(_key(namespace, email)); return false; }
    return entry.otp === String(otp);
};

const consume = (namespace, email) => store.delete(_key(namespace, email));

module.exports = { generate, set, verify, consume };
