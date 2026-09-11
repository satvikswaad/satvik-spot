import os

css_append = """
/* === NEW UTILITIES AND ANIMATIONS === */
.font-script { font-family: var(--font-handwriting); }
.brush-underline { position: relative; display: inline-block; }
.brush-underline::after { content: ''; position: absolute; left: -2%; right: -2%; bottom: 0.02em; height: 0.18em; border-radius: 999px; background: var(--brand-gold-accent); opacity: 0.85; transform: rotate(-1deg); }
.paper-texture { background-image: radial-gradient(rgba(50,60,40,0.04) 1px, transparent 1px); background-size: 22px 22px; }

@keyframes ss-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ss-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes ss-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
.animate-fade-up { animation: ss-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-float { animation: ss-float 6s ease-in-out infinite; }
.leaf-sway { transform-origin: bottom center; animation: ss-sway 7s ease-in-out infinite; }

.announcement-ticker { display: none !important; }

/* === SVG INLINE STYLES === */
.ref-leaf-spray { pointer-events: none; user-select: none; }
.ref-wavy-divider { display: block; width: 100%; }
.ref-paper-note { position: relative; padding: 20px; box-shadow: 0 6px 18px -6px rgba(60,50,20,0.35); clip-path: polygon(3% 0, 97% 2%, 100% 96%, 96% 100%, 4% 98%, 0 92%, 1% 6%); }
.ref-paper-note .tape { position: absolute; width: 74px; height: 26px; background: rgba(200,185,140,0.6); top: -12px; left: 50%; transform: translateX(-50%) rotate(-3deg); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
.ref-polaroid { position: relative; background: #faf8f2; padding: 12px 12px 20px; box-shadow: 0 14px 36px -14px rgba(60,50,20,0.5); }

/* === REFERENCE HEADER === */
.ref-header {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1500px;
  margin: 0 auto;
  height: 80px;
  padding: 0 16px;
}
.ref-logo-ring {
  display: block;
  width: 76px; height: 76px;
  border-radius: 50%;
  overflow: hidden;
  border: 2.5px solid rgba(229,168,37,0.7);
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  flex-shrink: 0;
}
.ref-logo-img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.ref-nav {
  display: flex !important;
  align-items: center;
  gap: 28px;
  margin: 0 auto;
}
.ref-nav .nav-link {
  position: relative;
  font-family: var(--font-body-new);
  font-size: 15px;
  font-weight: 600;
  color: var(--brand-ink);
  text-decoration: none;
  transition: color 0.2s;
}
.ref-nav .nav-link:hover { color: var(--brand-green); }
.ref-nav .nav-link.active { color: var(--brand-green); }
.ref-nav .nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -6px; left: 0;
  width: 100%; height: 3px;
  border-radius: 999px;
  background: var(--brand-green);
}
.ref-search-bar {
  position: relative;
  display: flex;
  align-items: center;
}
.ref-search-input {
  height: 44px;
  width: 240px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255,255,255,0.8);
  padding: 0 44px 0 16px;
  font-size: 14px;
  font-family: var(--font-body-new);
  color: var(--brand-ink);
}
.ref-search-input::placeholder { color: #9ca3af; }
.ref-search-input:focus { outline: none; border-color: var(--brand-gold-accent); box-shadow: 0 0 0 3px rgba(229,168,37,0.25); }
.ref-search-icon {
  position: absolute;
  right: 14px;
  top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px;
  color: var(--brand-green);
}
.ref-icon-btn {
  display: grid;
  place-items: center;
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--brand-ink);
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
}
.ref-icon-btn:hover { background: #edf3e9; color: var(--brand-green); }
.ref-icon-btn svg { width: 22px; height: 22px; }
.ref-cart-badge {
  position: absolute;
  top: -2px; right: -4px;
  min-width: 20px; height: 20px;
  border-radius: 999px;
  background: var(--brand-gold-accent);
  color: #3d2f0a;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  padding: 0 4px;
}
.ref-mobile-menu-btn {
  display: none;
}
@media (max-width: 1024px) {
  .ref-nav { display: none !important; }
  .ref-search-bar { display: none; }
  .ref-mobile-menu-btn { display: block; }
}
"""

with open(r'u:\SatvikSwad\public\site\style.css', 'a', encoding='utf-8') as f:
    f.write(css_append)

print("Appended new CSS.")
