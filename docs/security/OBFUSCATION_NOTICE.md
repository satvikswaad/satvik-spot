# Frontend Obfuscation: What It Does and What It Doesn't

## What the production build pipeline does

The `build/frontend-build.js` script applies two transformations to frontend JavaScript before deployment:

1. **Minification (Terser)**: Removes whitespace, shortens variable names, eliminates dead code, and compresses the output. This reduces file size and page load time.

2. **Obfuscation (javascript-obfuscator)**: Applies control flow flattening, string array encoding, and identifier renaming to make the minified code harder to read casually.

## What obfuscation protects

- **Casual inspection**: Someone viewing the browser DevTools source tab will see transformed code rather than readable variable names and logic flow. This raises the *effort* required to understand the client-side code.
- **Automated scraping**: Simple regex-based scrapers targeting known function/variable names will fail against obfuscated output.

## What obfuscation does NOT protect

- **Determined reverse engineering**: Any sufficiently motivated person can deobfuscate JavaScript. Tools like `de4js`, `synchrony`, and manual analysis in browser DevTools can undo most obfuscation transforms. Obfuscation is a speed bump, not a wall.
- **Secrets or API keys**: No secret, credential, or API key should ever be embedded in frontend code. Our Firebase config keys are *public* project identifiers (not secrets) — this is by Firebase's design.
- **Server-side logic**: All business-critical logic (pricing, stock validation, order totals, payment verification, authentication, authorization) runs exclusively on the backend. The client-side code only displays pre-computed values and sends sanitized requests.
- **Network traffic**: All API requests and responses are visible in the browser Network tab regardless of obfuscation. Our security boundary is the server-side validation, not client-side code hiding.

## Why this is sufficient

Our security model does not depend on client-side code secrecy:

| Security Control | Location | Depends on Obfuscation? |
|:---|:---|:---|
| Price computation | Server (`orderService.ts`) | No |
| Stock validation | Server (Firestore transaction) | No |
| Payment verification | Server (Razorpay webhook signature) | No |
| Authentication | Server (`verifyIdToken`) | No |
| Authorization (RBAC) | Server (`adminMiddleware.ts`) | No |
| Input validation | Server (`orderSchema.ts`) | No |
| Rate limiting | Server (`rateLimiter.ts`) | No |

Obfuscation adds a layer of inconvenience for casual code readers, but our actual security guarantees come from server-side enforcement. This is the correct architecture for any web application.
