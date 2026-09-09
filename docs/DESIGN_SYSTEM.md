# Satvik Swaad ? Design System

## 1. Brand Color Palette
The brand palette combines warm aged paper surfaces, deep botanical greens, golden spices, and earthen handwriting ink:

| Token | CSS Variable | Value | Hex Equivalent | Description |
|---|---|---|---|---|
| Background | `--background` | `oklch(0.965 0.014 92)` | `#FAF6F0` | Warm cream paper base |
| Card Surface | `--card` | `oklch(0.98 0.01 92)` | `#FDFCFA` | Clean elevated card paper |
| Deep Forest Ink | `--brand-ink` | `oklch(0.28 0.03 150)` | `#243324` | Primary high-contrast body text |
| Brand Green | `--brand-green` | `oklch(0.38 0.09 150)` | `#1F4A2C` | Leaf green for primary actions & active tabs |
| Deep Green | `--brand-green-deep` | `oklch(0.31 0.07 152)` | `#173B22` | Dark green for trust wave bar & corner folds |
| Green Title Text | `--brand-green-text` | `oklch(0.45 0.11 150)` | `#2E683E` | Script headings and highlighted copy |
| Brand Gold | `--brand-gold` | `oklch(0.78 0.14 78)` | `#E5A825` | Warm golden yellow for badges, buttons, sparkles |
| Deep Gold | `--brand-gold-deep` | `oklch(0.7 0.15 70)` | `#C98D1B` | Dark gold for category labels and brush underlines |
| Handwriting Ink | `--handwrite` | `oklch(0.44 0.12 40)` | `#7A3626` | Terracotta / maroon doodled note ink |
| Paper Note | `--paper-note` | `oklch(0.93 0.03 95)` | `#F4EEDC` | Parchment sticky note background |
| Soft Sage Surface| `--secondary` | `oklch(0.93 0.03 140)` | `#E6EDE6` | Sidebar cards, secondary badges |
| Structural Border| `--border` | `oklch(0.88 0.02 120)` | `#DCE1D8` | Subtle sage-cream boundary borders |

---

## 2. Typography
- **Primary Body Font**: `Nunito`, sans-serif (Weights: 400, 500, 600, 700, 800)
- **Primary Script / Handwriting Font**: `Caveat`, cursive (Weights: 400, 600, 700)
- **Legacy Display Font**: `DM Serif Display` / `Playfair Display` (used in legal & comparison headers)

---

## 3. SVG Decorative Motifs
All botanical and handwriting decorations are authored as scalable inline SVG paths:

### `LeafSpray` (`viewBox="0 0 120 120"`)
- Branch stem: `M20 108C34 78 46 60 74 40C86 31 98 24 108 18`
- 5 double-leaf pairs at angles: -35?, -20?, -5?, +10?, +22?
- Upper petal: `M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z` (opacity 0.90)
- Lower petal: `M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z` (opacity 0.72)

### `WavyDivider` (`viewBox="0 0 1440 60"`)
- Organic paper tear curve: `M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z`
- Supports fills: `var(--background)` or `var(--brand-green-deep)`

### `SparkleMark` (`viewBox="0 0 40 40"`)
- 3 radiant golden strokes: `M8 20h14`, `M10 10l9 6`, `M10 30l9 -6`
- Flanks script section titles on left and right (flipped)

### `HeartDoodle` (`viewBox="0 0 32 30"`)
- Hand-drawn heart outline: `M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z`

### `ArrowDoodle` (`viewBox="0 0 60 60"`)
- Curvy stem: `M6 8C22 14 34 26 40 46`
- Arrowhead: `M28 44l12 4 3 -12`

---

## 4. Component Styles
- **Paper Note**: Clip-path `polygon(3% 0, 97% 2%, 100% 96%, 96% 100%, 4% 98%, 0 92%, 1% 6%)`, background `var(--paper-note)`, translucent tape strip.
- **Polaroid**: 4:5 aspect ratio photo card, taped top header, drop shadow, handwriting caption with brush underline and heart doodle.
- **Brush Underline**: `::after` pseudo-element with rounded pill geometry and 1-degree rotation using `var(--brand-gold)`.
