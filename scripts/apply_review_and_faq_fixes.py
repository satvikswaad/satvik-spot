import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# 1. FIX SCRIPT.JS (CUSTOMER REVIEWS HOVER PAUSE)
# ==========================================
with open('public/site/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the animation setup and pause handlers in initCustomerRatingsMarquee
target_js_block = """    // Apply inline animation with high priority (Left-To-Right continuous slide)
    track.style.setProperty('animation-name', 'marqueeLeftToRight', 'important');
    track.style.setProperty('animation-duration', '36s', 'important');
    track.style.setProperty('animation-timing-function', 'linear', 'important');
    track.style.setProperty('animation-iteration-count', 'infinite', 'important');
    track.style.setProperty('animation-play-state', 'running', 'important');

    // JS-based continuous slider fallback:
    // If computed animationName is 'none' (e.g. OS reduced motion active), JS smoothly moves track left-to-right!
    if (window._satvikRatingsMarqueeRaf) {
        cancelAnimationFrame(window._satvikRatingsMarqueeRaf);
    }

    let isPaused = false;
    track.addEventListener('mouseenter', () => { isPaused = true; });
    track.addEventListener('mouseleave', () => { isPaused = false; });
    track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    track.addEventListener('touchend', () => { isPaused = false; }, { passive: true });"""

replacement_js_block = """    // Apply inline animation with high priority (Left-To-Right continuous slide)
    track.style.setProperty('animation-name', 'marqueeLeftToRight', 'important');
    track.style.setProperty('animation-duration', '38s', 'important');
    track.style.setProperty('animation-timing-function', 'linear', 'important');
    track.style.setProperty('animation-iteration-count', 'infinite', 'important');
    track.style.removeProperty('animation-play-state'); // Let CSS hover handle it, or JS dynamically toggle

    // JS-based continuous slider fallback:
    // If computed animationName is 'none' (e.g. OS reduced motion active), JS smoothly moves track left-to-right!
    if (window._satvikRatingsMarqueeRaf) {
        cancelAnimationFrame(window._satvikRatingsMarqueeRaf);
    }

    let isPaused = false;
    const pauseMarquee = () => {
        isPaused = true;
        track.style.setProperty('animation-play-state', 'paused', 'important');
    };
    const resumeMarquee = () => {
        isPaused = false;
        track.style.setProperty('animation-play-state', 'running', 'important');
    };

    const reviewsSection = document.getElementById('customer-ratings-section');
    const marqueeViewport = track.parentElement;

    if (reviewsSection) {
        reviewsSection.addEventListener('mouseenter', pauseMarquee);
        reviewsSection.addEventListener('mouseleave', resumeMarquee);
    }
    if (marqueeViewport) {
        marqueeViewport.addEventListener('mouseenter', pauseMarquee);
        marqueeViewport.addEventListener('mouseleave', resumeMarquee);
        marqueeViewport.addEventListener('touchstart', pauseMarquee, { passive: true });
        marqueeViewport.addEventListener('touchend', resumeMarquee, { passive: true });
    }
    track.addEventListener('mouseenter', pauseMarquee);
    track.addEventListener('mouseleave', resumeMarquee);

    track.querySelectorAll('.rating-marquee-card').forEach(card => {
        card.addEventListener('mouseenter', pauseMarquee);
        card.addEventListener('mouseleave', resumeMarquee);
    });"""

if target_js_block in js:
    js = js.replace(target_js_block, replacement_js_block, 1)
    print("Updated script.js hover pause logic successfully.")
else:
    js_norm = js.replace('\r\n', '\n')
    t_norm = target_js_block.replace('\r\n', '\n')
    r_norm = replacement_js_block.replace('\r\n', '\n')
    if t_norm in js_norm:
        js = js_norm.replace(t_norm, r_norm, 1)
        print("Updated script.js hover pause logic (normalized).")
    else:
        print("WARNING: target_js_block not found in script.js!")

with open('public/site/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

# ==========================================
# 2. FIX STYLE.CSS (HOVER PAUSE + FAQ NATURAL FONTS & REMOVE ARROWS/HEARTS)
# ==========================================
with open('public/site/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Update .ratings-marquee-track in style.css so it doesn't force animation-play-state: running !important
old_track_css = """.ratings-marquee-track {
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

new_track_css = """.ratings-marquee-track {
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
}"""

if old_track_css in css:
    css = css.replace(old_track_css, new_track_css)
    print("Cleaned .ratings-marquee-track in style.css.")
else:
    css = re.sub(
        r'\.ratings-marquee-track\s*\{[^}]*animation-play-state:\s*running\s*!important;[^}]*\}',
        new_track_css,
        css
    )
    print("Cleaned .ratings-marquee-track via regex in style.css.")

# Ensure comprehensive hover pause rules in style.css
css_hover_pause = """
/* PAUSE REVIEWS CAROUSEL ON MOUSE HOVER OR KEYBOARD FOCUS */
.customer-ratings-marquee-section:hover .ratings-marquee-track,
.ratings-marquee-viewport:hover .ratings-marquee-track,
.ratings-marquee-track:hover,
.ratings-marquee-track:focus-within,
.rating-marquee-card:hover {
    animation-play-state: paused !important;
}
"""

if "/* PAUSE REVIEWS CAROUSEL ON MOUSE HOVER OR KEYBOARD FOCUS */" not in css:
    css += "\n" + css_hover_pause

# Add FAQ Typography and Cleanup styles
faq_enhancements = """
/* ==========================================================================
   FAQS PAGE ENHANCEMENTS: NATURAL READABLE FONTS & CLEAN ARROW CONTROLS
   ========================================================================== */

/* Natural, clean heading for FAQ */
.script-title,
.script-title-wrapper h2,
.faq-accordion-container .script-title {
    font-family: var(--font-heading, 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif) !important;
    font-size: clamp(2rem, 3.5vw, 2.75rem) !important;
    font-weight: 700 !important;
    color: var(--color-green, #154D2B) !important;
    line-height: 1.2 !important;
    letter-spacing: -0.5px !important;
}

.faq-accordion-subtitle {
    font-family: var(--font-main, 'Plus Jakarta Sans', system-ui, sans-serif) !important;
    font-size: 1.05rem !important;
    color: var(--color-sub, #5A554E) !important;
    font-weight: 400 !important;
    line-height: 1.5 !important;
}

/* Natural readable typography on FAQ question items */
.faq-summary {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 18px 24px !important;
    font-family: var(--font-main, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif) !important;
    font-size: 1.05rem !important;
    font-weight: 600 !important;
    color: var(--color-green, #154D2B) !important;
    cursor: pointer !important;
    list-style: none !important;
    line-height: 1.45 !important;
    letter-spacing: -0.2px !important;
    transition: background 0.2s ease, color 0.2s ease !important;
}

.faq-summary:hover {
    background: #F7F5EE !important;
    color: var(--color-green-dark, #0E351D) !important;
}

.faq-item[open] .faq-summary {
    background: #F4EEDC !important;
    color: var(--color-green-dark, #0E351D) !important;
    border-bottom: 1px solid rgba(220, 205, 175, 0.4) !important;
}

/* Hide duplicate middle chevron entirely */
.faq-summary .chevron {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
}

/* Single elegant right-aligned arrow */
.faq-summary::after {
    content: '❯' !important;
    font-size: 0.95rem !important;
    color: var(--color-saffron, #D49A24) !important;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease !important;
    margin-left: auto !important;
    display: inline-block !important;
    flex-shrink: 0 !important;
}

.faq-item[open] .faq-summary::after {
    transform: rotate(90deg) !important;
    color: var(--color-green, #154D2B) !important;
}

/* Natural readable FAQ Answer text */
.faq-content {
    padding: 18px 24px 22px !important;
    font-family: var(--font-main, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif) !important;
    font-size: 0.98rem !important;
    color: #3D443F !important;
    line-height: 1.7 !important;
}

/* Suppress arrow doodle and heart doodle permanently on FAQs */
.heart-doodle,
.arrow-doodle,
.doodle-group,
.sparkle-mark {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
}

/* Polaroid caption with natural clean font */
.polaroid-caption {
    margin-top: 12px !important;
    text-align: center !important;
    font-family: var(--font-main, 'Plus Jakarta Sans', system-ui, sans-serif) !important;
    font-size: 1.05rem !important;
    font-weight: 600 !important;
    color: var(--color-maroon, #8c3a27) !important;
    display: block !important;
}

.polaroid-caption .brush-underline {
    font-family: inherit !important;
}
"""

if "FAQS PAGE ENHANCEMENTS: NATURAL READABLE FONTS" not in css:
    css += "\n" + faq_enhancements

with open('public/site/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated style.css.")

# ==========================================
# 3. FIX FAQ.HTML (REMOVE DUPLICATE CHEVRONS, HEART, ARROW DOODLE, SPARKLE MARKS)
# ==========================================
with open('public/site/faq.html', 'r', encoding='utf-8') as f:
    html = f.read()

orig_html_len = len(html)

# Remove all <span class="chevron"><svg ...></svg></span> from summaries
html = re.sub(
    r'\s*<span class="chevron"><svg[^>]*>.*?</svg></span>',
    '',
    html,
    flags=re.DOTALL
)
print("Removed duplicate <span class='chevron'> from faq.html.")

# Remove sparkle-mark SVGs from Common Questions title
html = re.sub(
    r'<svg[^>]*class="sparkle-mark"[^>]*>.*?</svg>\s*',
    '',
    html,
    flags=re.DOTALL
)
print("Removed sparkle-mark SVGs from faq.html.")

# Remove heart doodle from polaroid caption
html = re.sub(
    r'\s*<svg[^>]*class="heart-doodle"[^>]*>.*?</svg>',
    '',
    html,
    flags=re.DOTALL
)
print("Removed heart-doodle from polaroid caption in faq.html.")

# Remove doodle-group (which contains arrow-doodle, heart-doodle, and doodle text)
html = re.sub(
    r'<div class="doodle-group".*?</div>\s*</div>\s*<svg[^>]*class="arrow-doodle[^"]*"[^>]*>.*?</svg>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)
# Also general fallback for doodle-group
html = re.sub(
    r'<div class="doodle-group"[^>]*>.*?</div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)
print("Removed doodle-group and arrow-doodle from faq.html.")

with open('public/site/faq.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Updated faq.html: length changed from {orig_html_len} to {len(html)}.")
