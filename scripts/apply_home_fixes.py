import re

with open('public/site/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace why-choose-hero section cleanly
old_section_pattern = r'<section class="why-choose-hero relative isolate" aria-label="Why Choose Satvik Swaad">[\s\S]*?</section>'

new_section = '''<section class="why-choose-hero relative isolate" id="why-choose" aria-label="Why Choose Satvik Swaad">
      <div class="why-choose-bg-container">
        <!-- Two-column spotlight container with clean layout and zero clutter -->
        <div class="why-choose-content-container">
          <div class="why-choose-grid">
            <!-- Left Column: Story & Trust Badges -->
            <div class="why-choose-col-text animate-fade-up">
              <div class="why-choose-content">
                <div class="why-choose-eyebrow-badge">
                  <span class="doodle text-brand-gold-deep" data-i18n="whyChoose.eyebrow">Authentic Quality Pillars</span>
                </div>
                <h1 class="why-choose-title font-script">
                  Why Choose<br/>
                  <span class="brush-underline">Satvik Swaad</span>
                  <svg class="heart-doodle" viewBox="0 0 32 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
                  </svg>
                </h1>
                <p class="why-choose-desc text-brand-ink-80" data-i18n="whyChoose.desc">
                  We take immense pride in crafting authentic Indian pickles, murabbas, and traditional sweets without compromising on purity, ancestral recipes, or natural aging techniques.
                </p>

                <!-- Trust Badges List -->
                <div class="why-choose-trust-pills" role="list" aria-label="Key Trust Pillars">
                  <div class="why-choose-pill" role="listitem">
                    <span class="why-choose-pill-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </span>
                    <div class="why-choose-pill-info">
                      <span class="why-choose-pill-title" data-i18n="whyChoose.trustBadge1">100% Homemade</span>
                      <span class="why-choose-pill-sub" data-i18n="whyChoose.trustBadge1Sub">Handcrafted in small batches</span>
                    </div>
                  </div>

                  <div class="why-choose-pill" role="listitem">
                    <span class="why-choose-pill-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2"/><path d="M12 20v2"/>
                        <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                        <path d="M2 12h2"/><path d="M20 12h2"/>
                        <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                      </svg>
                    </span>
                    <div class="why-choose-pill-info">
                      <span class="why-choose-pill-title" data-i18n="whyChoose.trustBadge2">Sun-cured in Barnis</span>
                      <span class="why-choose-pill-sub" data-i18n="whyChoose.trustBadge2Sub">14-day natural ripening</span>
                    </div>
                  </div>

                  <div class="why-choose-pill" role="listitem">
                    <span class="why-choose-pill-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                        <path d="M6 6h10"/><path d="M6 10h10"/>
                      </svg>
                    </span>
                    <div class="why-choose-pill-info">
                      <span class="why-choose-pill-title" data-i18n="whyChoose.trustBadge3">Ancestral Recipes</span>
                      <span class="why-choose-pill-sub" data-i18n="whyChoose.trustBadge3Sub">Generational heritage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Official Satvik Swaad Branded Video Component -->
            <div class="why-choose-col-video animate-fade-up" style="animation-delay: 140ms;">
              <div class="why-choose-video-card" id="satvik-video-card">
                <!-- Top Badge -->
                <div class="video-card-top-tag">
                  <span class="video-card-tag-pulse" aria-hidden="true"></span>
                  <svg class="video-card-tag-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span class="video-card-tag-text" data-i18n="whyChoose.videoTag">Satvik Swaad Kitchen</span>
                </div>

                <!-- 16:9 Video Wrapper with Branded Cover & Configurable YouTube Player -->
                <div class="why-choose-video-wrapper" id="why-choose-video-container" data-youtube-id="">
                  <div class="satvik-video-poster-wrap" id="satvik-video-poster">
                    <img src="assets/SatvikSwaad_hero_second.png" alt="Satvik Swaad Artisanal Kitchen Preparation" class="satvik-video-poster-img" loading="lazy" />
                    <div class="satvik-video-poster-overlay"></div>
                    <button type="button" class="satvik-video-play-btn" id="btn-play-story-video" aria-label="Play Satvik Swaad Kitchen Story Video">
                      <span class="play-btn-pulse-ring" aria-hidden="true"></span>
                      <span class="play-btn-pulse-ring delay" aria-hidden="true"></span>
                      <svg class="play-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="7 4 19 12 7 20 7 4"/>
                      </svg>
                    </button>
                    <div class="satvik-video-poster-label">
                      <span class="poster-label-brand">Satvik Swaad</span>
                      <span class="poster-label-sub">Maa Ke Swaad Ki Virasat</span>
                    </div>
                  </div>
                </div>

                <!-- Artisanal Caption Footer -->
                <div class="why-choose-video-caption">
                  <div class="video-caption-icon-wrap" aria-hidden="true">
                    <svg class="video-caption-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="video-caption-content">
                    <p class="video-caption-title" data-i18n="whyChoose.videoCaption">Watch Our Traditional Village Kitchen &amp; Curing Process</p>
                    <span class="video-caption-meta" data-i18n="whyChoose.videoMeta">Pure mustard oil &bull; Clay Barnis &bull; Authentic heritage</span>
                  </div>
                </div>

                <!-- Decorative Brass Corner Accents -->
                <div class="video-card-corner tl" aria-hidden="true"></div>
                <div class="video-card-corner tr" aria-hidden="true"></div>
                <div class="video-card-corner bl" aria-hidden="true"></div>
                <div class="video-card-corner br" aria-hidden="true"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <svg class="wavy-divider h-8 md-h-12 -mt-8" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="var(--color-cream)" aria-hidden="true">
        <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" />
      </svg>
    </section>'''

html, count = re.subn(old_section_pattern, new_section, html, count=1)
print(f'Why choose section replaced: {count}')

# 2. Remove all cat-leaf-icon SVGs
cat_leaf_pattern = r'\s*<svg class="cat-leaf-icon"[^>]*>[\s\S]*?</svg>'
html, count_cat = re.subn(cat_leaf_pattern, '', html)
print(f'Cat leaf icons removed: {count_cat}')

# 3. Remove all leaf-spray SVGs (in quality pillars and compliance)
leaf_spray_pattern = r'\s*<svg class="leaf-spray[^>]*>[\s\S]*?</svg>'
html, count_spray = re.subn(leaf_spray_pattern, '', html)
print(f'Leaf spray SVGs removed: {count_spray}')

# 4. Check for any other leaf elements
remaining_leaves = re.findall(r'<[^>]*leaf[^>]*>', html, re.I)
print(f'Remaining leaf elements in index.html: {len(remaining_leaves)}')
for rl in remaining_leaves:
    print('  Remaining:', rl)

with open('public/site/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Updated public/site/index.html successfully written!')
