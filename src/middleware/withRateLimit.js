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

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

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

export function createMemoryStore({ now = () => Date.now() } = {}) {
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
        entry = { count: 0, resetAt: time + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return { count: entry.count, resetAt: entry.resetAt, now: time };
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
 * @param {Function} [options.key]       (req) => string, defaults to client IP
 * @param {boolean}  [options.resetOnSuccess]  clear the bucket when the
 *        handler answers < 400. Used for login, so only *failed* attempts
 *        count ("6th failed login in 15 min returns 429").
 * @param {string[]} [options.methods]   only limit these methods
 * @param {object}   [options.store]     store override (tests)
 */
export function withRateLimit(handler, options) {
  const {
    name,
    windowMs,
    max,
    key = getClientIp,
    resetOnSuccess = false,
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
    if (resetOnSuccess && res.statusCode < 400) store.reset(bucket);
    return result;
  };
}

export default withRateLimit;
