# Satvik Swaad ? Continuation Guide for Developers & AI Agents

## 1. How to Modify or Add a Product
1. Edit `public/site/js/productsData.js` to add the product definition with variants and pricing.
2. Update the product cards in `public/site/products.html` ensuring:
   - Data attribute is present: `.product-card[data-product-id="<product_id>"]`
   - Image uses an authentic transparent PNG in `public/site/assets/`
   - Price calculation tags `.price-val` and `.btn-add-cart` are maintained.
3. Run the frontend build: `npm run build:frontend:dev`
4. Run the backend tests: `npm --prefix backend run test` (must remain 350/350 passing).

---

## 2. Invariant Code Standards
- **Zero dynamic code execution**: Do not use `eval()`, `new Function()`, or `document.write()`. Automated preflight tests will reject deployments containing them.
- **Font Stack**: Always use `font-family: var(--font-handwriting)` for script accents and `var(--font-body-new)` for copy.
- **DOM IDs**: Never remove or rename an ID starting with `co-`, `cart-`, `btn-`, or `prof-`.

---

## 3. Local Development & QA Commands
- **Start Local Web Server**: `node scripts/serve-local.js` (Storefront on http://localhost:5000, Admin on http://localhost:5001)
- **Run Backend Test Suite**: `npm --prefix backend run test`
- **Rebuild Frontend Bundles**: `npm run build:frontend:dev`
- **Run Deployment Preflight**: `npx ts-node scripts/deploy-preflight.ts`
