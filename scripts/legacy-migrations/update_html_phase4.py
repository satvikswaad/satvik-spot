import os
import re

index_file = r'u:\SatvikSwad\public\site\index.html'

with open(index_file, 'r', encoding='utf-8') as f:
    content = f.read()

# The HTML to insert in place of trust-badges-section
new_html = """
    <!-- WHY CHOOSE HERO -->
    <section class="why-choose-hero relative isolate" aria-label="Why Choose Satvik Swaad">
      <div class="why-choose-bg-container">
        <img src="assets/village-hero.png" alt="" class="why-choose-bg-img" />
        <div class="why-choose-gradient"></div>

        <div class="why-choose-top-right-fold">
          <div class="fold-triangle"></div>
          <svg class="leaf-spray fold-leaf" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
            <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
            <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
          </svg>
        </div>

        <div class="why-choose-content-container">
          <div class="why-choose-content animate-fade-up">
            <span class="doodle text-brand-gold-deep block mb-2">Authentic Quality Pillars</span>
            <h1 class="why-choose-title font-script">
              Why Choose<br/>
              <span class="brush-underline">Satvik Swaad</span>
              <svg class="heart-doodle" viewBox="0 0 32 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
              </svg>
            </h1>
            <p class="why-choose-desc text-brand-ink-80">
              We take immense pride in crafting authentic Indian pickles, murabbas, and traditional sweets without compromising on purity, ancestral recipes, or natural aging techniques.
            </p>
          </div>
        </div>

        <div class="why-choose-right-products hidden-md">
          <div class="product-bowl drop-shadow-lg relative">
            <img src="assets/pickle-bowl.png" alt="" class="object-contain" />
          </div>
          <div class="product-jar drop-shadow-xl animate-float relative">
            <img src="assets/hara-mirch-jar.png" alt="Satvik Swaad Hara Mirch Pickle" class="object-contain" />
          </div>
        </div>

        <div class="why-choose-right-doodles hidden-lg text-right z-20">
          <span class="doodle text-brand-gold-deep block">Pure</span>
          <span class="doodle text-brand-gold-deep block">Desi</span>
          <span class="doodle text-brand-gold-deep block">Healthy</span>
          <svg class="heart-doodle text-brand-gold-deep ml-auto mt-1" viewBox="0 0 32 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
          </svg>
        </div>

        <div class="why-choose-left-note hidden-sm z-20">
          <div class="paper-note" style="transform: rotate(-8deg);">
            <span class="paper-note-tape"></span>
            <p class="font-script text-handwrite paper-note-text">Pure Traditional Goodness</p>
          </div>
        </div>
      </div>

      <svg class="wavy-divider h-8 md-h-12 -mt-8" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="var(--color-cream)">
        <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" />
      </svg>
    </section>

    <!-- QUALITY PILLARS SECTION -->
    <section class="quality-pillars-section">
      <div class="quality-pillars-grid">
        <article class="pillar-card group animate-fade-up" style="animation-delay: 0ms;">
          <div class="pillar-img-wrap">
            <img src="assets/pillar-sun-cured.png" alt="Sun-Cured Maturity" class="pillar-img" />
          </div>
          <div class="pillar-content bg-tone-1">
            <svg class="leaf-spray pillar-leaf-bg" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>
            <svg class="pillar-icon text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <h3 class="font-script pillar-title">Sun-Cured Maturity</h3>
            <p class="pillar-desc">Naturally sun-cured for rich flavour and authentic taste.</p>
          </div>
        </article>

        <article class="pillar-card group animate-fade-up" style="animation-delay: 90ms;">
          <div class="pillar-img-wrap">
            <img src="assets/pillar-mustard-oil.png" alt="Pure Cold-Pressed Mustard Oil" class="pillar-img" />
          </div>
          <div class="pillar-content bg-tone-2">
            <svg class="leaf-spray pillar-leaf-bg" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>
            <svg class="pillar-icon text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
            <h3 class="font-script pillar-title">Pure Cold-Pressed Mustard Oil</h3>
            <p class="pillar-desc">Rich in flavour, free from harmful chemicals.</p>
          </div>
        </article>

        <article class="pillar-card group animate-fade-up" style="animation-delay: 180ms;">
          <div class="pillar-img-wrap">
            <img src="assets/pillar-no-preservatives.png" alt="Zero Synthetic Preservatives" class="pillar-img" />
          </div>
          <div class="pillar-content bg-tone-3">
            <svg class="leaf-spray pillar-leaf-bg" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>
            <svg class="pillar-icon text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            <h3 class="font-script pillar-title">Zero Synthetic Preservatives</h3>
            <p class="pillar-desc">No artificial colours, flavours or preservatives.</p>
          </div>
        </article>

        <article class="pillar-card group animate-fade-up" style="animation-delay: 270ms;">
          <div class="pillar-img-wrap">
            <img src="assets/pillar-ancestral.png" alt="Ancestral Family Recipes" class="pillar-img" />
          </div>
          <div class="pillar-content bg-tone-4">
            <svg class="leaf-spray pillar-leaf-bg" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>
            <svg class="pillar-icon text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3 class="font-script pillar-title">Ancestral Family Recipes</h3>
            <p class="pillar-desc">Passed down through generations with love.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- COMPLIANCE SECTION -->
    <section class="compliance-section pb-12">
      <div class="compliance-card relative rounded-2xl border bg-card px-6 py-10 shadow md-px-12">
        <svg class="leaf-spray leaf-bl opacity-30" viewBox="0 0 120 120" fill="none">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
        </svg>
        <svg class="leaf-spray leaf-tr opacity-30" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
        </svg>

        <div class="compliance-flex">
          <div class="compliance-left-note hidden-lg">
            <div class="paper-note" style="transform: rotate(-6deg);">
              <span class="paper-note-tape"></span>
              <p class="font-script text-handwrite paper-note-text">Real Ingredients.<br/>Real Trust.</p>
            </div>
          </div>

          <div class="compliance-content">
            <div class="script-title-wrapper" style="justify-content: flex-start;">
              <svg class="sparkle-mark" viewBox="0 0 40 40" fill="none" stroke="var(--brand-gold-deep)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14"/><path d="M10 10l9 6"/><path d="M10 30l9 -6"/></svg>
              <h2 class="font-script text-brand-green-text"><span class="brush-underline">Transparent Compliance & Licensing Status</span></h2>
              <svg class="sparkle-mark" style="transform: scaleX(-1);" viewBox="0 0 40 40" fill="none" stroke="var(--brand-gold-deep)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14"/><path d="M10 10l9 6"/><path d="M10 30l9 -6"/></svg>
            </div>

            <div class="compliance-items-grid mt-8 grid-cols-1 md-grid-cols-3">
              <div class="comp-item flex-items-start">
                <span class="comp-icon-box bg-secondary text-brand-green">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <div>
                  <p class="comp-item-title text-brand-ink font-bold text-sm">FSSAI Registration / Licence:</p>
                  <p class="comp-item-status text-destructive font-semibold text-sm">Currently PENDING Approval.</p>
                </div>
              </div>
              <div class="comp-item flex-items-start">
                <span class="comp-icon-box bg-secondary text-brand-green">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
                </span>
                <div>
                  <p class="comp-item-title text-brand-ink font-bold text-sm">GSTIN Registration:</p>
                  <p class="comp-item-status text-destructive font-semibold text-sm">Currently PENDING Issuance.</p>
                </div>
              </div>
              <div class="comp-item flex-items-start">
                <span class="comp-icon-box bg-secondary text-brand-green">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="M3.3 7l7.703 4.752a2 2 0 0 0 2 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>
                </span>
                <div>
                  <p class="comp-item-title text-brand-ink font-bold text-sm">Packaging Standards:</p>
                  <p class="comp-item-status text-brand-ink-70 font-semibold text-sm">Food-grade glass & BPA-free airtight jars.</p>
                </div>
              </div>
            </div>

            <div class="compliance-actions mt-8 flex flex-wrap gap-4">
              <a href="products.html" class="brand-button gold">Explore 15 Products →</a>
              <a href="our-story.html" class="brand-button green">Read Our Brand Story →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
"""

# Replace the old section
import re
pattern = r'<!-- HORIZONTAL TRUST BADGES GRID \(3 CARDS COMPACT ON MOBILE\) -->.*?</section>'
content = re.sub(pattern, new_html, content, flags=re.DOTALL)

# Now, add trust footer bar BEFORE the existing footer, wait... Where is the existing footer?
# Actually, the green wave trust bar should be placed above the existing footer in all pages? The prompt says "Implement Phase 4 — Home Page / Why Choose Section (index.html) ... The existing 4-column footer must be PRESERVED unchanged. Only add the green wave trust bar ABOVE it."
# So I should also insert the trust footer bar above the footer in index.html.

trust_footer_html = """
    <!-- GREEN WAVE TRUST BAR -->
    <div class="trust-footer-bar">
      <svg class="wavy-divider h-8 md-h-12 -mb-px" fill="var(--brand-green-deep)" viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" />
      </svg>
      <div class="trust-footer-content relative overflow-hidden text-cream bg-brand-green-deep">
        <svg class="leaf-spray leaf-tl opacity-30" viewBox="0 0 120 120" fill="none">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
        </svg>
        <svg class="leaf-spray leaf-tr opacity-30" viewBox="0 0 120 120" fill="none" style="transform: scaleX(-1);">
              <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
              <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
              <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
        </svg>

        <div class="trust-benefits-row">
          <div class="trust-benefit-item">
            <svg class="h-7 w-7 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            <span class="text-lg font-semibold">100% Homemade</span>
          </div>
          <span class="benefit-divider hidden-sm"></span>
          <div class="trust-benefit-item">
            <svg viewBox="0 0 48 32" class="h-7 w-7 text-brand-gold" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M24 28C16 28 8 24 4 16C10 14 14 16 18 20" />
              <path d="M24 28C32 28 40 24 44 16C38 14 34 16 30 20" />
              <path d="M24 28C20 22 20 12 24 4C28 12 28 22 24 28Z" />
              <path d="M24 28C22 24 16 20 10 19" />
              <path d="M24 28C26 24 32 20 38 19" />
            </svg>
            <span class="text-lg font-semibold">Indian Tradition</span>
          </div>
          <span class="benefit-divider hidden-sm"></span>
          <div class="trust-benefit-item">
            <svg class="h-7 w-7 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <span class="text-lg font-semibold">For a Healthier You</span>
          </div>
        </div>
      </div>
    </div>
"""

footer_start = '<footer class="site-footer"'
if footer_start in content:
    content = content.replace(footer_start, trust_footer_html + '\n    ' + footer_start)
else:
    print("Could not find footer in index.html to insert trust bar.")
    
with open(index_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html!")
