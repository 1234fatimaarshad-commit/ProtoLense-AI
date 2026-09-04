/**
 * Vercel Serverless Function — API catch-all handler.
 *
 * vercel.json rewrites `/api/:path*` to this function. Vercel preserves the
 * ORIGINAL request path (e.g. `/api/auth/login`) in req.url when a rewrite
 * targets a function, so the Express app's mounted routers (/api/auth,
 * /api/projects, /api/audits, /api/health) dispatch exactly as they do in
 * local development.
 *
 * IMPORTANT: do not remove the `/api/:path*` rewrite from vercel.json.
 * By default this function is only reachable at the exact paths `/api` and
 * `/api/index` — every real endpoint lives at a sub-path, so without the
 * rewrite they all 404 at Vercel's platform level (which returned
 * `{ error: { code, message } }` bodies and crashed the frontend with
 * Minified React error #31).
 *
 * This preserves the full Express middleware stack (cors, JSON body parser,
 * multer uploads, error handlers) in a serverless context.
 */
const app = require('../server/index');

module.exports = app;
