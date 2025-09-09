function removeScriptTags(html) {
  if (typeof html !== 'string') return html;
  // Remove <script>...</script>
  let cleaned = html.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
  // Remove on* inline event handlers (e.g., onclick="...")
  cleaned = cleaned.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
                   .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
                   .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
  return cleaned;
}

module.exports = { removeScriptTags };


