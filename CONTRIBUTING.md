# Contributing to Satvik Swaad

This guide outlines standards, development workflows, and testing requirements for contributing to the Satvik Swaad repository.

---

## 1. Development Environment

- **Runtime**: Node.js 22 LTS
- **Package Manager**: npm
- **Type Checking**: TypeScript 5.x in strict mode (`"strict": true` configured in `tsconfig.json`)
- **Local Emulation**: Firebase CLI with Firestore and Authentication emulators configured.

To set up your local workspace:

```bash
# Clone the repository
git clone <repo-url>
cd SatvikSwad

# Install dependencies for root and workspaces
npm install
npm --prefix backend install
npm --prefix functions install
```

---

## 2. Branching and Release Workflow

- **`staging`**: Integration branch for active feature development, validation, and staging deployments.
- **`main`**: Production-ready branch. Deploys only after complete preflight and verification passes.

### Workflow:
1. Branch off `staging` for feature development or bug fixes:
   ```bash
   git checkout staging
   git checkout -b feature/order-utr-validation
   ```
2. Commit changes with clear, descriptive commit messages.
3. Open a Pull Request targeting `staging`.
4. Run automated pre-merge checks (`npm run verify`).
5. After verification in staging, create a PR from `staging` into `main` for production promotion.

---

## 3. Testing and Preflight Requirements

All pull requests and code modifications must pass the following validation scripts before merging:

1. **Static Type Validation**:
   ```bash
   npm run type-check
   ```
   Ensures both `backend/tsconfig.json` and `functions/tsconfig.json` compile with zero type errors.

2. **Backend Unit & Security Suite**:
   ```bash
   npm run test:backend
   ```
   Runs Jest test suites validating architecture boundaries, CORS configurations, security headers, order processing, and seed safety.

3. **Preflight Verification**:
   ```bash
   npm run preflight
   ```
   Executes configuration preflight checks before any deployment.

4. **Full Verification Pipeline**:
   ```bash
   npm run verify
   ```
   Runs type checking, backend unit tests, emulator tests, and deployment preflight in sequence.

---

## 4. Code Standards and Conventions

### 4.1 Factual Inline Comments
- Comments must describe what the code does or document specific non-obvious constraints.
- Do not use promotional, subjective, or hyperbolic phrases (e.g. avoid words such as "military-grade", "ultra-secure", "bulletproof", "unbreakable", "zero X").

### 4.2 Domain-Specific Naming
- Use descriptive, domain-specific variable and parameter names.
- Avoid single-letter or generic variable names (e.g., replace `e` with `orderProcessingError` or `submitEvent`, `res` with `responsePayload`, `data` with `productCatalog`).

### 4.3 Input Schema Validation
- All external input received at API route boundaries must be validated against explicit schema validators (e.g., `validateCreateOrderPayload` in `backend/src/validation/orderSchema.ts`).
- Reject unexpected keys, enforce string length bounds, and sanitize inputs to prevent injection and unexpected mutations.

### 4.4 Secret Management & Credential Safety
- Never commit API keys, service account credentials, `.env` files, or production secrets into source control.
- Ensure all sensitive environment variables (`FIREBASE_SERVICE_ACCOUNT_KEY`, `SESSION_SECRET`, etc.) are injected via deployment environment configurations or Google Secret Manager.
