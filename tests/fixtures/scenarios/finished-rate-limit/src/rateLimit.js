// In-memory fixed-window rate limiter: 100 requests per minute per API key.
// Mount it after the auth middleware. The auth middleware rejects a missing or
// unknown API key, so each key here is a valid key, and a client cannot get a
// new window with a new key.
const WINDOW_MS = 60_000;
const LIMIT = 100;
const windows = new Map();

// Delete the expired windows once in each window, so that the map holds only
// the keys of the last minute.
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) {
    if (now - w.start >= WINDOW_MS) windows.delete(key);
  }
}, WINDOW_MS).unref();

function rateLimit(req, res, next) {
  const key = req.headers['x-api-key'];
  if (typeof key !== 'string' || key === '') {
    // Fail closed when no auth middleware runs before the limiter.
    res.statusCode = 401;
    return res.end('Unauthorized');
  }
  const now = Date.now();
  let w = windows.get(key);
  if (!w || now - w.start >= WINDOW_MS) {
    w = { start: now, count: 0 };
    windows.set(key, w);
  }
  w.count += 1;
  if (w.count > LIMIT) {
    const retryAfter = Math.ceil((w.start + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.statusCode = 429;
    return res.end('Too Many Requests');
  }
  return next();
}

module.exports = { rateLimit };
