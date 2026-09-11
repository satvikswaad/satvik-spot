css_content = """
/* ==========================================================================
   PHASE 4: WHY CHOOSE / QUALITY PILLARS / COMPLIANCE
   ========================================================================== */

/* 1. WHY CHOOSE HERO */
.why-choose-hero {
  position: relative;
  isolation: isolate;
  background: var(--color-cream);
  overflow: hidden;
}

.why-choose-bg-container {
  position: relative;
  width: 100%;
  min-height: 420px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .why-choose-bg-container {
    min-height: 460px;
  }
}

.why-choose-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.why-choose-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, var(--color-cream) 0%, rgba(250, 246, 240, 0.85) 50%, transparent 100%);
  z-index: 2;
}
@media (min-width: 768px) {
  .why-choose-gradient {
    background: linear-gradient(to right, var(--color-cream) 0%, rgba(250, 246, 240, 0.6) 50%, transparent 100%);
  }
}

.why-choose-top-right-fold {
  position: absolute;
  right: 0;
  top: 0;
  height: 6rem;
  width: 6rem;
  z-index: 3;
}
.fold-triangle {
  height: 100%;
  width: 100%;
  background-color: var(--brand-green-deep);
  clip-path: polygon(100% 0, 0 0, 100% 100%);
}
.fold-leaf {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  height: 2.5rem;
  width: 2.5rem;
  opacity: 0.8;
}

.why-choose-content-container {
  position: relative;
  z-index: 10;
  margin: 0 auto;
  display: flex;
  min-height: 420px;
  max-width: 1500px;
  align-items: center;
  padding: 0 1.5rem;
}
@media (min-width: 768px) {
  .why-choose-content-container {
    min-height: 460px;
    padding: 0 3rem;
  }
}

.why-choose-content {
  max-width: 42rem;
}

.doodle {
  font-family: var(--font-handwriting);
  font-size: 1.5rem;
  line-height: 1.2;
}

.why-choose-title {
  font-family: var(--font-handwriting);
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 0.9;
  color: var(--brand-green);
  margin-top: 0.5rem;
}
@media (min-width: 768px) {
  .why-choose-title {
    font-size: 5rem;
  }
}

.brush-underline {
  position: relative;
  display: inline-block;
}
.brush-underline::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0.25em;
  background: var(--brand-gold-deep);
  opacity: 0.4;
  border-radius: 50%;
  transform: translateY(2px) rotate(-1deg);
  z-index: -1;
}

.heart-doodle {
  display: inline-block;
  height: 2.25rem;
  width: 2.25rem;
  color: var(--color-gold);
  vertical-align: middle;
}

.why-choose-desc {
  margin-top: 1.25rem;
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.625;
  color: rgba(32, 51, 37, 0.8);
}
@media (min-width: 768px) {
  .why-choose-desc {
    font-size: 1.125rem;
  }
}

.why-choose-right-products {
  pointer-events: none;
  position: absolute;
  bottom: 0;
  right: 2rem;
  z-index: 10;
  display: flex;
  align-items: flex-end;
}
.hidden-md {
  display: none;
}
@media (min-width: 768px) {
  .hidden-md {
    display: flex;
  }
}

.product-bowl {
  height: 11rem;
  width: 11rem;
  transform: translateY(0.5rem);
}
.product-bowl img {
  width: 100%;
  height: 100%;
}
.product-jar {
  height: 18rem;
  width: 13rem;
}
.product-jar img {
  width: 100%;
  height: 100%;
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.why-choose-right-doodles {
  position: absolute;
  right: 2rem;
  top: 2.5rem;
  display: none;
}
.hidden-lg {
  display: none;
}
@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

.why-choose-left-note {
  position: absolute;
  left: 1rem;
  top: 1.5rem;
  width: 9rem;
  display: none;
}
.hidden-sm {
  display: none;
}
@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

.paper-note {
  position: relative;
  background-color: var(--color-paper-note);
  padding: 1rem 1.25rem;
  box-shadow: 0 6px 18px -6px rgba(60, 50, 20, 0.35);
  clip-path: polygon(3% 0, 97% 2%, 100% 96%, 96% 100%, 4% 98%, 0 92%, 1% 6%);
}
.paper-note-tape {
  position: absolute;
  left: 50%;
  top: 0;
  height: 1.25rem;
  width: 4rem;
  transform: translate(-50%, -50%) rotate(-4deg);
  background-color: rgba(220, 215, 205, 0.7);
}
.paper-note-text {
  font-size: 1.25rem;
  line-height: 1.25;
}

.wavy-divider {
  display: block;
  width: 100%;
  height: 2rem;
  margin-top: -2rem;
  position: relative;
  z-index: 20;
}
@media (min-width: 768px) {
  .wavy-divider {
    height: 3rem;
    margin-top: -3rem;
  }
}

/* 2. QUALITY PILLARS */
.quality-pillars-section {
  margin: 0 auto;
  max-width: 1400px;
  padding: 1.5rem 1rem;
}
@media (min-width: 768px) {
  .quality-pillars-section {
    padding: 1.5rem 2rem;
  }
}

.quality-pillars-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 640px) {
  .quality-pillars-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .quality-pillars-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.pillar-card {
  overflow: hidden;
  border-radius: 1.5rem;
  background-color: #fff;
  box-shadow: 0 10px 30px -12px rgba(60, 50, 20, 0.25);
  transition: transform 0.3s;
}
.pillar-card:hover {
  transform: translateY(-4px);
}

.pillar-img-wrap {
  position: relative;
  height: 10rem;
  overflow: hidden;
}
.pillar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.pillar-card:hover .pillar-img {
  transform: scale(1.05);
}

.pillar-content {
  position: relative;
  padding: 1.25rem 1.25rem 1.5rem;
}
.bg-tone-1 { background-color: oklch(0.92 0.09 92); }
.bg-tone-2 { background-color: oklch(0.9 0.06 150); }
.bg-tone-3 { background-color: oklch(0.9 0.05 25); }
.bg-tone-4 { background-color: oklch(0.92 0.09 92); }

.pillar-leaf-bg {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  height: 2.25rem;
  width: 2.25rem;
  opacity: 0.4;
  pointer-events: none;
}

.pillar-icon {
  height: 1.75rem;
  width: 1.75rem;
  margin-bottom: 0.5rem;
}

.pillar-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--brand-ink);
}

.pillar-desc {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.625;
  color: rgba(32, 51, 37, 0.75);
}


/* 3. COMPLIANCE SECTION */
.compliance-section {
  margin: 0 auto;
  max-width: 1400px;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 3rem;
}
@media (min-width: 768px) {
  .compliance-section {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.compliance-card {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-card-bg);
  padding: 2.5rem 1.5rem;
  box-shadow: 0 12px 40px -16px rgba(60, 50, 20, 0.3);
}
@media (min-width: 768px) {
  .compliance-card {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}

.leaf-bl {
  position: absolute;
  bottom: 0.5rem;
  left: -0.5rem;
  height: 4rem;
  width: 4rem;
}
.leaf-tr {
  position: absolute;
  top: 0.5rem;
  right: -0.5rem;
  height: 4rem;
  width: 4rem;
}

.compliance-flex {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .compliance-flex {
    flex-direction: row;
    align-items: center;
  }
}

.compliance-left-note {
  flex-shrink: 0;
}

.compliance-content {
  flex: 1;
}

.script-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sparkle-mark {
  height: 1.5rem;
  width: 1.5rem;
}
.script-title-wrapper h2 {
  font-size: 2.25rem;
  margin: 0;
  line-height: 1;
}
@media (min-width: 768px) {
  .script-title-wrapper h2 {
    font-size: 3rem;
  }
}

.compliance-items-grid {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (min-width: 768px) {
  .compliance-items-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.comp-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.comp-icon-box {
  display: grid;
  place-items: center;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  background-color: var(--color-green-light);
}

.comp-item-title {
  margin: 0;
}
.comp-item-status {
  margin: 0;
}

.text-brand-ink { color: var(--brand-ink); }
.text-destructive { color: #e11d48; }
.text-brand-ink-70 { color: rgba(32, 51, 37, 0.7); }
.text-handwrite { color: var(--color-handwrite); }

.compliance-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
}
.brand-button.gold {
  border: 2px solid var(--color-gold);
  color: var(--color-dark);
  background: transparent;
}
.brand-button.gold:hover {
  background: var(--color-gold-light);
  color: var(--color-maroon);
}
.brand-button.green {
  background: var(--brand-green-deep);
  color: #fff;
  border: 2px solid transparent;
}
.brand-button.green:hover {
  background: var(--brand-green);
}

/* 4. TRUST FOOTER BAR */
.trust-footer-bar {
  position: relative;
  margin-top: auto;
}

.-mb-px { margin-bottom: -1px; }

.trust-footer-content {
  padding: 2rem 1rem;
}
.leaf-tl {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  height: 4rem;
  width: 4rem;
}

.trust-benefits-row {
  margin: 0 auto;
  max-width: 56rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}
@media (min-width: 640px) {
  .trust-benefits-row {
    flex-direction: row;
    gap: 0;
  }
}

.trust-benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.benefit-divider {
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  height: 2rem;
  width: 1px;
  background-color: rgba(255,255,255,0.25);
  display: block;
}

.text-brand-gold-deep { color: var(--brand-gold-deep); }
.text-brand-green { color: var(--brand-green); }
.text-brand-green-text { color: var(--brand-green-text); }
.text-brand-gold { color: var(--color-gold); }

/* UTIL CLASSES */
.mt-8 { margin-top: 2rem; }
.mb-2 { margin-bottom: 0.5rem; }
.pb-12 { padding-bottom: 3rem; }
.h-8 { height: 2rem; }
.h-12 { height: 3rem; }
.md-h-12 { height: 3rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.flex-items-start { align-items: flex-start; }
"""

with open(r'u:\SatvikSwad\public\site\style.css', 'a', encoding='utf-8') as f:
    f.write(css_content)

print("CSS appended to style.css!")
