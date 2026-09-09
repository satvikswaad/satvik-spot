# OWASP ZAP Baseline Security Scan Configuration Guide

## 1. Overview

This document specifies the operational configuration and execution procedures for running OWASP ZAP (Zed Attack Proxy) baseline security scans against the **Satvik Swaad** platform.

Because OWASP ZAP is containerized, local installation of Java or ZAP desktop binaries is not required. Scans run inside the official container image (`ghcr.io/zaproxy/zaproxy:stable`) and produce standardized reports in HTML, JSON, and Markdown formats.

---

## 2. Scanning Assets Inventory

| File Path | Description |
|---|---|
| [tests/security/zap-baseline.conf](file:///u:/SatvikSwad/tests/security/zap-baseline.conf) | ZAP rule definition file configuring alert thresholds (`FAIL`, `WARN`, `INFO`, `IGNORE`). |
| [tests/security/run-zap-scan.ps1](file:///u:/SatvikSwad/tests/security/run-zap-scan.ps1) | PowerShell scanner execution script for Windows workstations. |
| [tests/security/run-zap-scan.sh](file:///u:/SatvikSwad/tests/security/run-zap-scan.sh) | POSIX Bash scanner execution script for Linux, macOS, and CI runners. |
| [tests/security/OWASP_ZAP_CONFIGURATION.md](file:///u:/SatvikSwad/tests/security/OWASP_ZAP_CONFIGURATION.md) | Technical reference and CI integration guide (this document). |

---

## 3. Rule Policy Configuration (`zap-baseline.conf`)

OWASP ZAP baseline scan enforces passive rules against HTTP requests and responses. The rule file uses tab-delimited records: `<RuleId>\t<Action>\t<Comment>`.

### Enforced Rules (`FAIL`)
A violation of any of the following rules produces exit code `1` and fails the scan:

- **10035**: `Strict-Transport-Security` header missing or insecure (enforces HSTS `max-age=31536000; includeSubDomains`).
- **10038**: `Content-Security-Policy` header not set or invalid.
- **10021**: `X-Content-Type-Options: nosniff` header missing.
- **10010**: Cookie without `HttpOnly` flag.
- **10011**: Cookie without `Secure` flag.
- **10054**: Cookie without `SameSite` attribute (`SameSite=Strict` or `SameSite=Lax`).
- **10036 / 10037**: Server information leaks via `Server` or `X-Powered-By` headers (`x-powered-by` is disabled in `backend/src/app.ts`).
- **10023 / 90022**: Information disclosure via debug error messages or stack traces (handled by centralized error handler in `backend/src/app.ts`).
- **10040 / 10041 / 10042**: Mixed active/passive content or insecure HTTP/HTTPS transitions.
- **10028**: Open redirect vulnerabilities.
- **90028**: Insecure HTTP methods enabled (e.g. TRACE, TRACK).

### Suppressed False Positives (`IGNORE`)
- **10016**: `Web Browser XSS Protection Not Enabled` (`X-XSS-Protection`). Modern browsers have deprecated this header in favor of robust Content Security Policies. Setting it can introduce client-side side-channel leaks in older browsers.
- **10032**: `ViewState (ASP.NET)`. The Satvik Swaad backend runs Node.js 22 and Express; ASP.NET ViewState inspection does not apply.
- **10061**: `X-AspNet-Version Response Header`. ASP.NET headers do not apply to Node.js / Express services.

---

## 4. Execution Procedures

### Prerequisites
- Docker installed and Docker daemon running.
- Network accessibility to target host.

### Windows (PowerShell)
To scan a running local instance at `http://localhost:5000`:
```powershell
powershell -ExecutionPolicy Bypass -File tests/security/run-zap-scan.ps1 -TargetUrl "http://localhost:5000"
```

To scan the staging deployment with warning enforcement:
```powershell
powershell -ExecutionPolicy Bypass -File tests/security/run-zap-scan.ps1 -TargetUrl "https://satvik-spot-backend-staging.onrender.com" -FailOnWarn
```

To scan protected endpoints using an Authorization Bearer token:
```powershell
powershell -ExecutionPolicy Bypass -File tests/security/run-zap-scan.ps1 -TargetUrl "http://localhost:5000" -BearerToken "mock_admin_token"
```

### Linux / macOS / CI Runner (Bash)
To scan a local instance:
```bash
chmod +x tests/security/run-zap-scan.sh
./tests/security/run-zap-scan.sh http://localhost:5000
```

To scan with an authenticated session:
```bash
BEARER_TOKEN="mock_admin_token" ./tests/security/run-zap-scan.sh http://localhost:5000
```

---

## 5. Script Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `TargetUrl` | String | `http://localhost:5000` | Target URL to scan. Automatically translates `localhost` to `host.docker.internal` inside Docker containers on Windows/macOS. |
| `ReportDir` | Path | `tests/security/reports` | Directory where HTML (`zap-report.html`), JSON (`zap-report.json`), and Markdown (`zap-report.md`) reports are saved. |
| `ConfigFile` | Path | `tests/security/zap-baseline.conf` | Path to the custom ZAP rule thresholds file. |
| `BearerToken` | String | `""` (empty) | Injects an `Authorization: Bearer <token>` header into all outbound scanning requests using ZAP replacer config. |
| `DockerImage` | String | `ghcr.io/zaproxy/zaproxy:stable` | Pinned official ZAP stable container image. |
| `FailOnWarn` | Switch / Boolean | `false` | When `true`, exits with status `1` if any `WARN` rules are triggered. |

---

## 6. Exit Codes

- `0`: Scan passed. Zero security violations detected.
- `1`: Scan failed. At least one rule marked `FAIL` was violated, or `FailOnWarn` was set and warnings were found.
- `2`: Warnings detected (exit code 0 returned unless `FailOnWarn` is active).
- `3`: Execution error (Docker unreachable, invalid arguments, or target unreachable).

---

## 7. CI Pipeline Integration Example (GitHub Actions)

To schedule automated OWASP ZAP baseline scanning in GitHub Actions:

```yaml
  zap-baseline-scan:
    name: OWASP ZAP Baseline Security Scan
    runs-on: ubuntu-latest
    needs: [security-and-quality-checks]
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci
          npm --prefix backend ci

      - name: Build Backend Service
        run: npm --prefix backend run build

      - name: Start Backend in Background
        run: |
          node backend/dist/server.js &
          sleep 5
          curl -f http://localhost:5000/health || exit 1

      - name: Execute OWASP ZAP Scan
        run: |
          chmod +x tests/security/run-zap-scan.sh
          ./tests/security/run-zap-scan.sh http://localhost:5000

      - name: Upload ZAP Security Report Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: owasp-zap-baseline-reports
          path: tests/security/reports/
```
