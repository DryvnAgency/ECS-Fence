import { next } from '@vercel/edge';

export const config = {
  matcher: '/pages/ops-7d4f9a2c/:path*',
};

const USERNAMES = ['EDGARM', 'EDDIEP', 'RYANM'];
const ITERATIONS = 100_000;
const KEY_BITS = 256;

export default async function middleware(req) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return unauthorized();

  let decoded;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(':');
  if (sep === -1) return unauthorized();

  const username = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);
  const key = username.toUpperCase();

  if (!USERNAMES.includes(key)) return unauthorized();

  const expectedHash = process.env[`OPS_USER_${key}_HASH`];
  const salt = process.env[`OPS_USER_${key}_SALT`];
  if (!expectedHash || !salt) return unauthorized();

  const computed = await pbkdf2(password, salt);
  if (!timingSafeEqual(computed, expectedHash)) return unauthorized();

  return next();
}

async function pbkdf2(password, saltB64) {
  const enc = new TextEncoder();
  const salt = b64decode(saltB64);
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return b64encode(new Uint8Array(bits));
}

function b64decode(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64encode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ECS Ops"',
      'Cache-Control': 'no-store',
    },
  });
}
