// URL handling for the Browser app.
//
// The Browser app shows pages in an <iframe>. Many big sites (Google, Bing,
// GitHub, YouTube, MDN...) send `X-Frame-Options` or a CSP `frame-ancestors`
// rule that tells the browser not to show them inside another site, so the
// frame just says "refused to connect". There is no way to read that header
// from the parent page, so we keep a list of well-known hosts that block it and
// show an "open in a new tab" card for them instead of a broken frame.

export const FRAME_BLOCKED_HOSTS = [
  'google.com',
  'bing.com',
  'duckduckgo.com',
  'github.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'linkedin.com',
  'reddit.com',
  'stackoverflow.com',
  'developer.mozilla.org',
  'chatgpt.com',
  'claude.ai',
];

const SEARCH_URL = 'https://en.wikipedia.org/w/index.php?search=';

// Turns what the user typed into a safe http(s) URL.
// - "example.com" -> "https://example.com/"
// - "some words"  -> Wikipedia search (it allows framing, unlike search engines)
// - javascript:, data:, file: and other schemes -> null (rejected)
export function normalizeUrl(input) {
  const text = String(input ?? '').trim();
  if (!text) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text);
  if (hasScheme && !/^https?:\/\//i.test(text)) {
    // Only bare "host:port" is allowed without http(s), e.g. "localhost:3000".
    if (!/^[\w.-]+:\d+(\/|$)/.test(text)) return null;
  }

  const looksLikeHost =
    /^https?:\/\//i.test(text) ||
    (!/\s/.test(text) && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(text)) ||
    /^localhost(:\d+)?(\/.*)?$/i.test(text) ||
    /^[\w.-]+:\d+(\/|$)/.test(text);

  if (!looksLikeHost) return SEARCH_URL + encodeURIComponent(text);

  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export function isFrameBlocked(href) {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return FRAME_BLOCKED_HOSTS.some(
      (h) => host === h || host.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}
