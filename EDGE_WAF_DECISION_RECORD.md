# Edge / WAF Architectural Decision Record

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Decision Status**: **NOT REQUIRED FOR CURRENT STAGING / RECOMMENDED BEFORE PRODUCTION**  

---

## 1. Evaluation of Existing Edge Protections

| Layer | Hosting Provider | Built-in Protections | Evaluation |
| :--- | :--- | :--- | :--- |
| **Frontend Storage & CDN** | Firebase Hosting (Google Infrastructure) | Google Edge Network DDoS mitigation, HTTP/2 & HTTP/3, TLS 1.3, automated SSL certificates | **EXCELLENT** for static asset delivery and global CDN availability |
| **Application Backend** | Render (`satvik-spot-backend`) | Built-in TLS termination, DDoS filtering at ingress, HTTP/2 support | **SUFFICIENT** for staging traffic load |
| **Application Layer Security** | Express Server (`backend/`) | Distributed Firestore Rate Limiter, Helmet security headers, CORS origin allowlist, request body limit (50KB) | **HIGH** server-authoritative control |

---

## 2. Trade-Off Analysis & Recommendation

- **Current Staging Verdict**: **NOT REQUIRED**. Firebase Hosting and Render provide edge TLS termination and basic DDoS protection without additional cost or proxy hop complexity.
- **Production Recommendation**: **RECOMMENDED BEFORE PRODUCTION** if high-volume automated bot scraping or layer-7 HTTP flood attacks occur post-launch.
- **Operational Trade-Offs**:
  1. Adding a proxy layer (e.g. Cloudflare) requires configuring `trust proxy = 2` on Express backend to accurately derive client IPs.
  2. Must ensure proxy does not strip or alter `Authorization` or `X-Firebase-AppCheck` headers.
