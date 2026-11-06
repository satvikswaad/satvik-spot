import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. UPDATE public/site/index.html
with open('public/site/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

orig_len = len(html)

# A. Remove catalog-corner-foliage (the vine SVGs flanking search bar)
# Look for: <!-- BACKGROUND CORNER BOTANICALS --> ... until <!-- SEARCH + CATEGORY CONTROL ROW -->
html = re.sub(
    r'<!-- BACKGROUND CORNER BOTANICALS -->\s*<div class="catalog-corner-foliage.*?<!-- SEARCH \+ CATEGORY CONTROL ROW -->',
    '<!-- SEARCH + CATEGORY CONTROL ROW -->',
    html,
    flags=re.DOTALL
)

# Also remove any standalone catalog-corner-foliage divs
html = re.sub(
    r'<div class="catalog-corner-foliage[^"]*"[^>]*>.*?</div>\s*',
    '',
    html,
    flags=re.DOTALL
)

# B. Remove all card-botanical-twig divs
html = re.sub(
    r'<div class="card-botanical-twig"[^>]*>.*?</div>\s*',
    '',
    html,
    flags=re.DOTALL
)

# C. Clean leaf icons from category tabs
# Category Tab "All" (data-category="all")
# Replace the leaf icon with a clean grid/all icon
old_all_pill_leaf = """<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M17 8C8 10 5 16 3 21C6 20 12 18 16 13C18 10 18 8 17 8Z"/>
                            <path d="M17 8C19 5 21 3 22 2C21 4 20 7 17 8Z"/>
                        </svg>"""

new_all_pill_icon = """<svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>"""

if old_all_pill_leaf in html:
    html = html.replace(old_all_pill_leaf, new_all_pill_icon)
    print("Replaced All tab leaf icon with grid icon.")
else:
    # regex fallback
    html = re.sub(
        r'<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">\s*<path d="M17 8C8 10.*?<\/svg>',
        new_all_pill_icon,
        html,
        flags=re.DOTALL
    )
    print("Replaced All tab leaf icon via regex.")

# Category Tab "Health & Drinks" (data-category="health")
# Replace leaf icon with health/heart icon
old_health_pill_leaf = """<svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 22V12"/>
                            <path d="M12 12C12 7 7 4 2 5C2 10 5 15 12 16"/>
                            <path d="M12 10C12 6 16 3 21 4C21 9 18 13 12 14"/>
                        </svg>"""

new_health_pill_icon = """<svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>"""

if old_health_pill_leaf in html:
    html = html.replace(old_health_pill_leaf, new_health_pill_icon)
    print("Replaced Health tab leaf icon with heart/wellness icon.")
else:
    html = re.sub(
        r'<svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\s*<path d="M12 22V12"\/>.*?<\/svg>',
        new_health_pill_icon,
        html,
        flags=re.DOTALL
    )
    print("Replaced Health tab leaf icon via regex.")

# D. Replace leaf emojis
html = html.replace('<span>🌿</span> <span>100% Satvik Purity Guarantee', '<span>✨</span> <span>100% Satvik Purity Guarantee')
html = html.replace('data-action="purity">🌿 Purity &amp; Mustard Oil', 'data-action="purity">✨ Purity &amp; Mustard Oil')
html = html.replace('🌿', '✨')

with open('public/site/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Updated index.html: length changed from {orig_len} to {len(html)}")

# 2. UPDATE public/site/style.css
with open('public/site/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# A. Suppress all botanical and leaf classes permanently with zero display
suppression_rule = """
/* UNIVERSAL LEAF & BOTANICAL SUPPRESSION (100% CLEAN HOMEPAGE) */
.catalog-corner-foliage,
.card-botanical-twig,
.foliage-tl,
.foliage-tr,
.foliage-bl,
.ref-story-leaf,
.ref-story-leaf-top-right,
.ref-story-leaf-bot-right,
.ref-story-leaf-bot-left,
.ref-story-leaf-top-left,
.ref-story-leaf-right-top,
.ref-story-leaf-right-bot,
.hp-corner-leaves-wrap,
.hp-corner-leaf-left,
.hp-corner-leaf-right,
.hero-corner-leaf,
.corner-leaf,
.fold-leaf,
.pillar-leaf-bg,
.leaf-bl,
.leaf-tr,
.leaf-tl,
.cat-leaf-icon,
.ref-leaf-spray,
.leaf-sway,
.wave-leaf-left,
.wave-leaf-right,
.ref-sidebar-bottom-leaf,
.footer-branch {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
}
"""

if "UNIVERSAL LEAF & BOTANICAL SUPPRESSION" not in css:
    css += "\n" + suppression_rule

# B. Remove prefers-reduced-motion block that was turning off ratings-marquee-track animation
css = re.sub(
    r'@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{\s*\.ratings-marquee-track\s*\{[^}]*\}\s*\}',
    '/* prefers-reduced-motion disabled for ratings-marquee to guarantee smooth continuous sliding */',
    css
)

# C. Update .ratings-marquee-track to have !important on animation so it ALWAYS slides left-to-right
old_marquee_css = """.ratings-marquee-track {
    display: flex;
    gap: 24px;
    width: max-content;
    will-change: transform;
    animation: marqueeLeftToRight 42s linear infinite;
}"""

new_marquee_css = """.ratings-marquee-track {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 24px !important;
    width: max-content !important;
    min-width: max-content !important;
    will-change: transform !important;
    animation-name: marqueeLeftToRight !important;
    animation-duration: 38s !important;
    animation-timing-function: linear !important;
    animation-iteration-count: infinite !important;
    animation-play-state: running !important;
}"""

if old_marquee_css in css:
    css = css.replace(old_marquee_css, new_marquee_css)
    print("Updated .ratings-marquee-track in style.css directly.")
else:
    # Use regex replacement
    css = re.sub(
        r'\.ratings-marquee-track\s*\{[^}]*animation:[^}]*\}',
        new_marquee_css,
        css
    )
    print("Updated .ratings-marquee-track via regex.")

# D. Update hover pause to only pause on .ratings-marquee-track:hover or card hover, NOT whole viewport
css = css.replace(
    '.ratings-marquee-viewport:hover .ratings-marquee-track,\n.ratings-marquee-viewport:focus-within .ratings-marquee-track {',
    '.ratings-marquee-track:hover,\n.ratings-marquee-track:focus-within {'
)

# Ensure keyframe marqueeLeftToRight is robust
kf_check = """@keyframes marqueeLeftToRight {
    0% {
        transform: translate3d(-50%, 0, 0);
    }
    100% {
        transform: translate3d(0%, 0, 0);
    }
}"""
if "@keyframes marqueeLeftToRight" not in css:
    css += "\n" + kf_check

with open('public/site/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated style.css.")
