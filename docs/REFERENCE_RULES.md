# Satvik Swaad ? Reference Rules & QA Standards

## 1. The 24 Strict Non-Negotiable Rules
1. **Single Source of Truth**: The 7 reference screenshots in `REFRENCE_PICS/` are the authoritative specification.
2. **No Invented Visuals**: Never invent backgrounds, houses, trees, flowers, leaves, icons, or illustrations.
3. **No Asset Substitution**: Never replace reference assets with generic stock images, emojis, or AI generation.
4. **No CSS Redrawing of Images**: Use actual photo and illustration assets directly. CSS/SVG is reserved for structural dividers and line doodles.
5. **Background Composition Preserved**: Exact horizon, lighting, and village landscape framing must be maintained.
6. **Footer Preserved**: The existing 4-column footer is permanent. The green wave trust bar sits directly above it.
7. **Header Replicated**: Circular gold-ring logo (76px), nav items, pill search bar, icon-only cart & profile.
8. **Evidence-Based Typography**: Fonts are `Nunito` (body) and `Caveat` (script), verified from `.ref_source/app/layout.tsx`.
9. **No Invented Data**: All prices, product counts, and contact lines match reference sources.
10. **Preserve Functionality**: Never break cart drawer, checkout modal, Razorpay, auth, or search.
11. **Unreferenced Pages Unchanged**: `product-details.html`, policy pages, and `why-us.html` retain their core layout.
12. **Reference > Text**: If any written description conflicts with the screenshot, the screenshot wins.
13. **Exact Geometry**: Border radius (1rem), spacing, rotation (-3deg to -8deg), and shadows must match.
14. **Decorations are UI**: Leaves, tape strips, hearts, and sparkles are mandatory UI elements.
15. **No Generic Templates**: Each page retains its distinct reference composition.
16. **Mandatory Visual QA**: Render, inspect, compare against screenshot, fix discrepancies.
17. **No Single-Pass Halts**: Iterate until pixel alignment is achieved.
18. **Permanent AI Brain**: Maintain all 10 documentation files in `/docs` describing the live codebase.
19. **Reference-to-Code Mapping**: Document the exact chain from screenshot to asset to code.
20. **Animation Fidelity**: Replicate floating and swaying timing without adding gratuitous effects.
21. **Preserve Architecture**: Vanilla HTML/CSS/JS frontend, Express backend, Firestore.
22. **Pre-Implementation Asset Audit**: Verify all assets exist before modifying code.
23. **Missing Asset Protocol**: Log any missing asset in `ASSET_MAP.md` (0 currently missing).
24. **Final Success Condition**: Site looks identical to screenshots while passing all 350 tests.
