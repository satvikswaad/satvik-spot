css_content = """
/* === PHASE 2 SHOP PAGE CSS === */

/* Utility overrides for shop view */
.ref-shop-view {
    max-width: 1400px;
    margin: 0 auto;
}
.md-flex-row { flex-direction: row !important; }
.md-items-center { align-items: center !important; }
.lg-flex-row { flex-direction: row !important; }
.lg-w-64 { width: 16rem !important; }
.xl-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }

/* Hero Banner */
.ref-shop-hero-section {
    position: relative;
    width: 100%;
}
.ref-hero-bg-container {
    position: relative;
    height: 300px;
    width: 100%;
    overflow: hidden;
}
@media (min-width: 768px) {
    .ref-hero-bg-container { height: 360px; }
}
.ref-hero-bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.ref-hero-gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, oklch(0.35 0.05 120 / 0.55), oklch(0.5 0.05 110 / 0.15), transparent);
}
.ref-hero-corner-fold {
    position: absolute;
    right: 0;
    top: 0;
    height: 6rem;
    width: 6rem;
}
.ref-corner-bg {
    height: 100%;
    width: 100%;
    background-color: var(--brand-green-deep);
    clip-path: polygon(100% 0, 0 0, 100% 100%);
}
.ref-corner-leaf {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
    height: 2.5rem;
    width: 2.5rem;
}
.ref-hero-copy {
    position: relative;
    height: 100%;
    max-width: 1500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 1.5rem;
}
@media (min-width: 768px) {
    .ref-hero-copy { padding: 0 3rem; }
}
.ref-hero-title {
    line-height: 0.85;
}
.ref-hero-top-text {
    font-size: 2.25rem;
    color: oklch(0.98 0.02 92);
}
@media (min-width: 768px) {
    .ref-hero-top-text { font-size: 3.75rem; }
}
.ref-hero-main-text {
    margin-top: 0.25rem;
    font-size: 3rem;
    color: var(--brand-gold-accent);
}
@media (min-width: 768px) {
    .ref-hero-main-text { font-size: 4.5rem; }
}
.ref-hero-subtitle {
    margin-top: 1rem;
    font-size: 1.5rem;
    color: oklch(0.95 0.05 92);
}
@media (min-width: 768px) {
    .ref-hero-subtitle { font-size: 1.875rem; }
}
.ref-hero-products-right {
    position: absolute;
    bottom: 0;
    right: 1.5rem;
    align-items: flex-end;
}
.hidden { display: none !important; }
@media (min-width: 768px) {
    .md-flex { display: flex !important; }
    .md-block { display: block !important; }
}
@media (min-width: 1024px) {
    .lg-block { display: block !important; }
}
@media (min-width: 1280px) {
    .xl-block { display: block !important; }
}
.ref-pickle-bowl-wrap {
    position: relative;
    height: 10rem;
    width: 10rem;
    transform: translateY(0.75rem);
}
.ref-hara-mirch-wrap {
    position: relative;
    height: 16rem;
    width: 12rem;
}
.ref-hero-doodle-right {
    position: absolute;
    right: 1.5rem;
    top: 2rem;
}
.doodle-text-white {
    color: oklch(0.98 0.02 92);
}
.ref-hero-wavy {
    margin-top: -2rem;
    height: 2rem;
}
@media (min-width: 768px) {
    .ref-hero-wavy { margin-top: -3rem; height: 3rem; }
}

/* Shop Layout */
.ref-script-title-wrap {
    justify-content: flex-start;
}
.ref-shop-doodle-left {
    top: -2.5rem;
    left: 0;
}
.ref-shop-doodle-right {
    right: 0.5rem;
    top: 10rem;
}
.ref-sort-select {
    padding-right: 2.25rem;
}
.ref-select-chevron {
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
}

/* Sidebar */
.ref-sidebar {
    background: var(--color-cream-light);
    border: 1px solid var(--color-border);
}
.ref-cat-btn {
    background: var(--brand-green);
    color: white;
}
.ref-cat-btn.active {
    background: var(--brand-green);
    color: white;
}
.ref-cat-link {
    color: var(--brand-ink);
    opacity: 0.8;
}
.ref-cat-link:hover {
    background: rgba(0,0,0,0.05);
}
.ref-cat-link.active {
    color: var(--brand-green);
    opacity: 1;
}
.ref-cat-list { list-style: none; padding: 0; }
.ref-filters { list-style: none; padding: 0; }
.ref-search-sidebar {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
}

/* Product Cards */
.ref-product-card {
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
}
.ref-product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
.ref-product-badge {
    background: #e6f4ea;
    color: var(--brand-green-text);
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 9999px;
    z-index: 10;
}
.ref-product-img {
    height: 250px;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.ref-product-card:hover .ref-product-img {
    transform: scale(1.05);
}
.ref-add-btn {
    background: var(--brand-green);
    color: white;
    padding: 0.75rem;
    border-radius: 0.75rem;
    font-weight: 700;
    transition: background 0.2s;
    border: none;
    cursor: pointer;
}
.ref-add-btn:hover {
    background: var(--brand-green-deep);
}

/* Trust Bar */
.ref-trust-bar-inner {
    background-color: var(--brand-green-deep);
}
.ref-trust-wavy {
    margin-bottom: -1px;
    z-index: 10;
    position: relative;
}
.ref-trust-grid {
    padding-top: 2rem;
    padding-bottom: 2rem;
}
.md-gap-16 { gap: 4rem !important; }
"""

with open(r'u:\SatvikSwad\public\site\style.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("CSS appended.")
