/**
 * Satvik Swaad — Safe DOM Creation & Manipulation Utilities (XSS-4)
 * File: public/site/js/dom.js
 */

/**
 * Creates a DOM element safely without innerHTML.
 * Conforms strictly to Rule XSS-4 and FE-1.
 *
 * @param {string} tag Element tag name
 * @param {Record<string, any>} [attrs] Attributes, event listeners, and datasets
 * @param {Array<Node|string|number>|Node|string|number} [children] Children or text
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (val === undefined || val === null || val === false) continue;

      if (key.startsWith('on') && typeof val === 'function') {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, val);
      } else if (key === 'className' || key === 'class') {
        el.className = String(val);
      } else if (key === 'dataset' && typeof val === 'object') {
        for (const [dataKey, dataVal] of Object.entries(val)) {
          el.dataset[dataKey] = String(dataVal);
        }
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key === 'textContent' || key === 'text') {
        el.textContent = String(val);
      } else {
        el.setAttribute(key, String(val));
      }
    }
  }

  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (child === undefined || child === null || child === false) continue;
    if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }

  return el;
}

/**
 * Empties all children from an element without innerHTML = ''.
 * @param {HTMLElement} element
 */
export function clearChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Also expose on window for non-module scripts if needed
if (typeof window !== 'undefined') {
  window.DOMHelper = { h, clearChildren };
}
