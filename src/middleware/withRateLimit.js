// Small fixed-window rate limiter for Next.js API routes (#104).
//
// Next.js API routes aren't Express, so express-rate-limit's middleware
// (which relies on Express's req.ip and `trust proxy`) doesn't fit well.
// This keeps the same idea in ~100 lines with no extra dependency.
//
// The store is in memory, per server process. That's right for local dev
// and for our single-process production server. If OrbitOS ever runs on
// several instances, swap `createMemoryStore` for a shared store (Redis
// INCR + PEXPIRE gives the same fixed-window behaviour).

import { isIPv6 } from 'net';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Upper bound on buckets kept in memory. Past this, the oldest bucket is
// dropped, so a flood of unique keys can't grow the process without limit.
export const MAX_KEYS = 50000;

/**
 * The client's IP address.
 *
 * Production runs behind a Cloudflare tunnel, so every request reaches
 * Next.js from loopback and the real address is in `cf-connecting-ip`
 * (Cloudflare sets it and clients can't spoof it). We only trust that
 * header when the socket itself is loopback, i.e. the request came through
 * the local tunnel. A direct client can never fake a loopback socket.
 * `x-forwarded-for` is never trusted because any client can send it.
 */
export function getClientIp(req) {
  const socketIp =
    req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  if (LOOPBACK.has(socketIp)) {
    const cfIp = req.headers?.['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim();
  }
  return socketIp;
}

/**
 * The rate-limit key for a client: its IP, with IPv6 addresses cut to their
 * /64 prefix. One subscriber usually gets a whole /64, so keying on the full
 * address would let a single client rotate through endless fresh buckets.
 */
export function clientKey(req) {
  let ip = getClientIp(req);
  if (ip.startsWith('::ffff:') && ip.includes('.')) return ip.slice(7);
  if (!isIPv6(ip)) return ip;
  ip = ip.split('%')[0];
  const [head, tail = ''] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::')
    ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((g) => parseInt(g, 16).toString(16))
    .join(':')}::/64`;
}

export function createMemoryStore({
  now = () => Date.now(),
  maxKeys = MAX_KEYS,
} = {}) {
  const hits = new Map();
  let nextSweep = 0;

  const sweep = (time) => {
    if (time < nextSweep) return;
    for (const [key, entry] of hits) {
      if (entry.resetAt <= time) hits.delete(key);
    }
    nextSweep = time + 60 * 1000;
  };

  return {
    increment(key, windowMs) {
      const time = now();
      sweep(time);
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= time) {
        hits.delete(key);
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value);
        entry = { count: 0, resetAt: time + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return { count: entry.count, resetAt: entry.resetAt, now: time };
    },
    decrement(key) {
      const entry = hits.get(key);
      if (entry && entry.count > 0) entry.count -= 1;
    },
    reset(key) {
      hits.delete(key);
    },
    size() {
      return hits.size;
    },
  };
}

const defaultStore = createMemoryStore();

/**
 * Wrap an API route with a rate limit.
 *
 * @param {Function} handler  the Next.js API route
 * @param {object}   options
 * @param {string}   options.name        bucket name, e.g. 'login'
 * @param {number}   options.windowMs    window length in ms
 * @param {number}   options.max         requests allowed per window
 * @param {Function} [options.key]       (req) => string, defaults to
 *        clientKey (the client IP, IPv6 cut to its /64)
 * @param {boolean}  [options.resetOnSuccess]  clear the bucket when the
 *        handler answers < 400. Used for login, so only *failed* attempts
 *        count ("6th failed login in 15 min returns 429").
 * @param {boolean}  [options.skipSuccessful]  don't count requests the
 *        handler answers < 400, without clearing earlier failures. Used
 *        for the per-IP login cap, which a single success must not reset.
 * @param {string[]} [options.methods]   only limit these methods
 * @param {object}   [options.store]     store override (tests)
 */
export function withRateLimit(handler, options) {
  const {
    name,
    windowMs,
    max,
    key = clientKey,
    resetOnSuccess = false,
    skipSuccessful = false,
    methods,
    store = defaultStore,
  } = options;

  return async function rateLimited(req, res) {
    if (methods && !methods.includes(req.method)) return handler(req, res);

    const bucket = `${name}:${key(req)}`;
    const { count, resetAt, now } = store.increment(bucket, windowMs);
    const remaining = Math.max(0, max - count);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil((resetAt - now) / 1000)));

    if (count > max) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many attempts. Please wait and try again.',
        details: { retryAfter },
      });
    }

    const result = await handler(req, res);
    if (res.statusCode < 400) {
      if (resetOnSuccess) store.reset(bucket);
      else if (skipSuccessful) store.decrement(bucket);
    }
    return result;
  };
}

export default withRateLimit;
