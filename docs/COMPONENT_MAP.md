# Satvik Swaad ? Component Architecture Map

## 1. SiteHeader (`.site-header` / `.ref-header`)
- **Container**: Max-width 1500px, 80px height, sticky with backdrop blur (`bg-background/95`).
- **Logo**: 76px circular frame (`.ref-logo-ring`) with 2.5px gold border (`rgba(229,168,37,0.7)`), overlapping slightly.
- **Nav Links**: Nunito 15px font, bold, active indicator with 3px green pill underline.
- **Search Bar**: 240px rounded pill input with green Lucide search icon.
- **Account Action**: Circular icon button linking to `profile.html`.
- **Cart Action**: Circular icon button with live `#cart-count-badge` gold badge count.
- **Mobile Drawer**: Responsive dropdown `#header-dropdown-menu` with hamburger toggle.

---

## 2. HeroBanner (`.hero-banner` / `.ref-hero-banner`)
- **Background**: Full-width `village-hero.png` with left-to-right green overlay gradient.
- **Corner Fold**: Top-right deep green polygon fold (`polygon(100% 0, 0 0, 100% 100%)`) with flipped `LeafSpray`.
- **Left Copy**: Title in Caveat font with `.brush-underline` and `.HeartDoodle`.
- **Right Arrangement**: Dual product composition (`pickle-bowl.png` + floating `hara-mirch-jar.png`).
- **Divider**: Bottom organic tear curve via `WavyDivider`.

---

## 3. Polaroid (`.polaroid-card` / `.ref-polaroid`)
- **Structure**: 4:5 aspect ratio photo card, white paper background, drop shadow.
- **Tape Strip**: Semi-translucent aged tape strip at top-center, rotated -3deg.
- **Image**: `mother-child.png` (village mother lovingly feeding daughter).
- **Caption**: "Maa ke swaad ki virasat" in Caveat font with brush underline and heart doodle.

---

## 4. TrustBar (`.trust-footer-bar` / `.ref-trust-footer-bar`)
- **Position**: Placed immediately above the existing 4-column footer on all reference pages.
- **Divider**: Dark green `WavyDivider` (`fill="var(--brand-green-deep)"`).
- **Surface**: Deep green background with 30% opacity `LeafSpray` decorations on left and right edges.
- **3 Trust Badges**:
  1. `100% Homemade` (Leaf icon)
  2. `Indian Tradition` (Lotus SVG icon)
  3. `For a Healthier You` (Heart icon)

---

## 5. Preserved Interactive Modals & Widgets
- **Cart Drawer**: `#cart-drawer-overlay`, `.cart-drawer`, `#cart-items-container`, `#cart-total-display`.
- **Checkout Modal**: `#checkout-modal`, full multi-step delivery address and payment choice form.
- **Help Assistant Widget**: `#satvik-agent-widget`, `#satvik-agent-trigger`, chat dialogue modal.
- **Toast Feedback**: `#toast` notification banner with ARIA live region.
