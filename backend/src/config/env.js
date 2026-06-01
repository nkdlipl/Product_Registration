require('dotenv').config();

console.log('--- Environment Sync Audit ---');
console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASS')));
console.log('FRONTEND_URL value:', process.env.FRONTEND_URL ? 'PRESENT' : 'MISSING');
console.log('FRONTEND_URLS value:', process.env.FRONTEND_URLS ? 'PRESENT' : 'MISSING');

// Support multiple frontend origins via FRONTEND_URLS (comma-separated).
const cleanUrl = (url) => url ? url.trim().replace(/^["']|["']$/g, '').replace(/\/$/, "") : null;

const frontendUrlsEnv = process.env.FRONTEND_URLS;
let frontendUrls = frontendUrlsEnv
  ? frontendUrlsEnv.split(',').map(cleanUrl).filter(Boolean)
  : (process.env.FRONTEND_URL ? [cleanUrl(process.env.FRONTEND_URL)] : ['http://localhost:5173']);

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URLS: frontendUrls,
  FRONTEND_URL: frontendUrls[0]
};

// Simple validation
Object.entries(env).forEach(([key, value]) => {
  if (!value && key === 'DATABASE_URL') {
    console.warn(`Warning: Environment variable ${key} is not set.`);
  }
  if (!value && (key === 'JWT_SECRET' || key === 'JWT_REFRESH_SECRET')) {
    throw new Error(`CRITICAL: Environment variable ${key} is missing. Startup aborted to prevent login-forgery risks.`);
  }
});

module.exports = env;
