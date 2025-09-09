const { setupServer } = require('msw/node');
const { http, HttpResponse } = require('msw');

// Example: intercept external SMTP HTTP calls if used (placeholder)
const handlers = [
  http.get('https://example.com/health', () => HttpResponse.json({ ok: true })),
];

const server = setupServer(...handlers);

module.exports = { server, handlers, http, HttpResponse };
