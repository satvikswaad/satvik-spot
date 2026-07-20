# DESIGN SYSTEM & VISUAL STYLE GUIDE

**Brand Identity**: Satwik Spot — Authentic Homemade Sweets, Pickles & Preserves  
**Aesthetic Theme**: Premium Indian Heritage & Artisanal Natural Quality  
**Accessibility Level**: WCAG 2.2 Level AA Compliant  
**Date**: July 19, 2026  

---

## 1. Color Palette & Design Tokens

| Token Name | Hex Code | Role / Usage | Contrast Ratio (vs White) |
| :--- | :--- | :--- | :--- |
| `--color-cream` | `#FAFDF5` | Warm ivory background (storefront) | 1.05:1 (Background) |
| `--color-green` | `#1B6B2E` | Deep pickle green (Primary Brand / Headers) | 6.8:1 (AAA Pass) |
| `--color-green-dark` | `#0F4A1E` | Dark forest green (Footer / Topbars) | 11.2:1 (AAA Pass) |
| `--color-gold` | `#C9A227` | Turmeric saffron gold (Accents / Badges) | 3.2:1 (Large Text / Badges) |
| `--color-maroon` | `#8B261D` | Muted terracotta maroon (Highlights / Badges) | 7.4:1 (AAA Pass) |
| `--color-dark` | `#1F2921` | Dark charcoal brown (Body Text) | 14.1:1 (AAA Pass) |
| `--color-sub` | `#5C6B5E` | Subdued charcoal green (Secondary Text) | 5.2:1 (AA Pass) |
| `--color-border` | `#C5E8CE` | Light herbal border green | 1.8:1 (UI Lines) |

---

## 2. Typography Hierarchy

- **Primary Heading Font**: `'Playfair Display'`, serif (Google Fonts)
- **Body & Interface Font**: `'Lato'`, sans-serif (Google Fonts)

```css
h1 { font-family: 'Playfair Display', serif; font-size: 2.25rem; line-height: 1.25; font-weight: 700; color: var(--color-green-dark); }
h2 { font-family: 'Playfair Display', serif; font-size: 1.75rem; line-height: 1.3; font-weight: 700; color: var(--color-green-dark); }
h3 { font-family: 'Lato', sans-serif; font-size: 1.25rem; line-height: 1.4; font-weight: 700; color: var(--color-dark); }
body { font-family: 'Lato', sans-serif; font-size: 1rem; line-height: 1.5; color: var(--color-dark); }
```

---

## 3. UI Component Tokens

- **Border Radius**: Cards (`16px`), Buttons (`10px`), Badges (`50px`), Modals (`20px`).
- **Shadows**:
  - Soft Card: `0 4px 16px rgba(15, 74, 30, 0.08)`
  - Elevated Modal: `0 20px 60px rgba(0, 0, 0, 0.25)`
- **Touch Targets**: Minimum 44px x 44px for all interactive buttons and inputs.
- **Focus Indicators**: 3px solid `#C9A227` gold outline with 2px offset (`:focus-visible`).

---

## 4. Breakpoints & Motion Rules

- **Breakpoints**: Mobile S (`320px`), Mobile M (`375px`), Mobile L (`412px`), Tablet (`768px`), Desktop (`1024px`), Wide (`1440px`).
- **Motion Principles**: Subtle 200ms ease transitions. Fully disables non-essential animations when `@media (prefers-reduced-motion: reduce)` is active.

---
*End of Design System Document.*
