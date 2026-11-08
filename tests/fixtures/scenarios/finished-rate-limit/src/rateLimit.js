// In-memory fixed-window rate limiter: 100 requests per minute per API key.
const WINDOW_MS = 60_000;
const LIMIT = 100;
const windows = new Map();

function rateLimit(req, res, next) {
  const key = req.headers['x-api-key'];
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
