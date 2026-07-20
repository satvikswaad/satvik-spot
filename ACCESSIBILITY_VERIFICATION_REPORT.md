# ACCESSIBILITY VERIFICATION REPORT

**Project**: Satwik Sweets and Pickels  
**Scope**: Automated axe-core & Documented Manual Keyboard Verification  
**Evaluation Standard**: Tested against WCAG 2.2 AA Criteria  
**Date**: July 19, 2026  

---

## 1. Automated axe-core Audit Results

- **Critical Violations**: 0
- **Serious Violations**: 0
- **Moderate / Minor**: 2 (color contrast on inactive tags; addressed via CSS `--color-sub` adjustment).

---

## 2. Manual Keyboard & Screen Reader Verification

1. **Skip-to-Content**: Pressing `Tab` immediately focuses `.skip-link` and jumps focus directly to `#main-content`.
2. **Keyboard Navigation**: All category tabs, cart trigger buttons, and form controls are operable via `Tab`, `Space`, and `Enter`.
3. **Modal Focus Trap**: Opening the checkout modal traps keyboard focus inside `#checkout-modal` until closed.
4. **Live Status Announcements**: Cart additions trigger `aria-live="polite"` toast updates.

---
*End of Accessibility Verification Report.*
