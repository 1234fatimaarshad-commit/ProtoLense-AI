/**
 * Vercel Serverless Function — API catch-all handler.
 *
 * Vercel routes all /api/* requests to this single function.
 * The Express app's internal router then dispatches to the correct
 * sub-route (auth, projects, audits, health).
 *
 * This preserves the full Express middleware stack (cors, JSON body
 * parser, multer uploads, error handlers) in a serverless context.
 */
const app = require('../server/index');

module.exports = app;
