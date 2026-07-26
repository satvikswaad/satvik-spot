/**
 * Shared Client Security & Input Validation Utility Module
 */

export function sanitizeText(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateUrl(url) {
  if (!url || typeof url !== 'string') return 'assets/aam-ka-achar.png';
  const trimmed = url.trim();

  // Block dangerous schemes
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
    console.warn('Blocked dangerous URL scheme:', url);
    return 'assets/aam-ka-achar.png';
  }

  // Allow safe relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('assets/')) {
    return trimmed;
  }

  // Allow HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch (e) {
    // Invalid URL
  }

  return trimmed;
}

export function createSafeElement(tag, options = {}) {
  const el = document.createElement(tag);

  if (options.text !== undefined && options.text !== null) {
    el.textContent = String(options.text);
  }

  if (options.className) {
    el.className = options.className;
  }

  if (options.id) {
    el.id = options.id;
  }

  if (options.style) {
    el.style.cssText = options.style;
  }

  if (options.src) {
    el.setAttribute('src', validateUrl(options.src));
  }

  if (options.alt) {
    el.setAttribute('alt', sanitizeText(options.alt));
  }

  if (options.href) {
    el.setAttribute('href', validateUrl(options.href));
  }

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      if (key.toLowerCase().startsWith('on')) continue; // Block inline event attributes
      if (key === 'src' || key === 'href') {
        el.setAttribute(key, validateUrl(value));
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  if (options.events) {
    for (const [evt, handler] of Object.entries(options.events)) {
      el.addEventListener(evt, handler);
    }
  }

  if (options.children && Array.isArray(options.children)) {
    options.children.forEach(child => {
      if (child) el.appendChild(child);
    });
  }

  return el;
}
