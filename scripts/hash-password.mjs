import { webcrypto as crypto } from 'node:crypto';

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error('Usage: node scripts/hash-password.mjs <username> <password>');
  console.error('Example: node scripts/hash-password.mjs EdgarM "<chosen password>"');
  process.exit(1);
}

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  'raw',
  enc.encode(password),
  { name: 'PBKDF2' },
  false,
  ['deriveBits'],
);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
  key,
  256,
);

const b64 = (buf) => Buffer.from(buf).toString('base64');
const upper = username.toUpperCase();

console.log(`# Add these to Vercel Project Settings → Environment Variables (Production):`);
console.log(`OPS_USER_${upper}_HASH=${b64(new Uint8Array(bits))}`);
console.log(`OPS_USER_${upper}_SALT=${b64(salt)}`);
