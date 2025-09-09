function applySecurityHeaders(app) {
  app.disable('x-powered-by');
}

module.exports = { applySecurityHeaders };