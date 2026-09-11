import re
from bs4 import BeautifulSoup

file_path = r'u:\SatvikSwad\public\site\products.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
catalog = soup.find('section', id='catalog')
if not catalog:
    print("Could not find section#catalog")
    exit(1)

# Extract product cards
product_cards = catalog.find_all('div', class_='product-card')
cards_data = []

for card in product_cards:
    product_id = card.get('data-product-id')
    category = card.get('data-category')
    img_tag = card.find('img', class_='product-img')
    img_src = img_tag['src'] if img_tag else ''
    img_alt = img_tag['alt'] if img_tag else ''
    
    hindi_title = card.find('span', class_='product-hindi-title')
    hindi_title = hindi_title.text if hindi_title else ''
    
    title = card.find('h3', class_='product-title')
    title = title.text if title else ''
    
    desc = card.find('p', class_='product-desc')
    desc = desc.text if desc else ''
    
    rating_span = card.find('span', text=re.compile(r'★'))
    rating = rating_span.text if rating_span else '★ 4.8 (20)'
    
    price_val = card.find('span', class_='price-val')
    price_val = price_val.text if price_val else '₹199'
    
    mrp_val = card.find('span', class_='mrp-val')
    mrp_val = mrp_val.text if mrp_val else '₹250'
    
    savings = card.find('span', class_='savings-tag')
    savings = savings.text if savings else 'Save 20%'
    
    # badges
    badges_container = card.find('div', class_='product-card-top')
    badges = [b.text for b in badges_container.find_all('span', class_='product-badge')] if badges_container else []
    badge_text = badges[0] if badges else 'Bestseller'
    
    cards_data.append({
        'id': product_id,
        'cat': category,
        'img': img_src,
        'alt': img_alt,
        'hindi': hindi_title,
        'title': title,
        'desc': desc,
        'rating': rating,
        'price': price_val,
        'mrp': mrp_val,
        'savings': savings,
        'badge': badge_text
    })

# Now generate the new HTML
# Hero Banner
hero_html = """
    <!-- HERO BANNER -->
    <section class="ref-shop-hero-section relative isolate">
      <div class="ref-hero-bg-container">
        <img src="assets/village-hero.png" alt="" class="ref-hero-bg-img object-cover" />
        <div class="ref-hero-gradient-overlay"></div>
        <div class="ref-hero-corner-fold">
          <div class="ref-corner-bg"></div>
          <svg viewBox="0 0 120 120" class="ref-leaf-spray ref-flip ref-corner-leaf opacity-80" aria-hidden="true" fill="none">
            <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
            <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
          </svg>
        </div>

        <div class="ref-hero-copy z-10 animate-fade-up">
          <h1 class="font-script font-bold drop-shadow-sm ref-hero-title">
            <span class="block ref-hero-top-text">Our</span>
            <span class="inline-flex items-center gap-3 ref-hero-main-text">
              <span class="brush-underline">Products</span>
              <svg viewBox="0 0 32 30" class="h-8 w-8 text-brand-gold" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
              </svg>
            </span>
          </h1>
          <p class="font-script ref-hero-subtitle">
            <span class="brush-underline">Pure • Traditional • Healthy</span>
          </p>
        </div>

        <div class="ref-hero-products-right z-10 hidden md-flex">
          <div class="ref-pickle-bowl-wrap">
            <img src="assets/pickle-bowl.png" alt="" class="object-contain drop-shadow-lg" />
          </div>
          <div class="ref-hara-mirch-wrap animate-float">
            <img src="assets/hara-mirch-jar.png" alt="Satvik Swaad Hara Mirch Pickle jar" class="object-contain drop-shadow-xl" />
          </div>
        </div>

        <div class="ref-hero-doodle-right z-20 hidden lg-block text-right">
          <span class="font-script text-2xl text-handwrite block doodle-text-white">Real</span>
          <span class="font-script text-2xl text-handwrite block doodle-text-white">Ingredients</span>
          <span class="font-script text-2xl text-handwrite block doodle-text-white">Real Taste</span>
          <svg viewBox="0 0 32 30" class="ml-auto mt-1 h-5 w-5 doodle-text-white" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
          </svg>
        </div>
      </div>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="ref-wavy-divider ref-hero-wavy" aria-hidden="true">
        <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--color-cream)"/>
      </svg>
    </section>
"""

shop_html = """
        <section id="catalog" aria-label="Products Catalogue" class="ref-shop-view relative mx-auto max-w-1400 px-4 py-8 md-px-8">
            <div class="ref-shop-doodle-right hidden xl-block pointer-events-none absolute text-center text-brand-handwrite">
                <span class="font-script text-2xl leading-tight text-brand-green-text block">Good</span>
                <span class="font-script text-2xl leading-tight text-brand-green-text block">Food</span>
                <span class="font-script text-2xl leading-tight text-brand-green-text block">Happy</span>
                <span class="font-script text-2xl leading-tight text-brand-green-text block">Life</span>
                <svg viewBox="0 0 32 30" class="mx-auto mt-1 h-5 w-5 text-brand-gold-deep" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" />
                </svg>
            </div>

            <div class="ref-shop-header mb-6 flex flex-col md-flex-row md-items-center justify-between gap-4">
                <div class="relative">
                    <div class="flex items-center justify-center gap-3 ref-script-title-wrap">
                        <svg viewBox="0 0 40 40" class="h-6 w-6" aria-hidden="true" fill="none" stroke="var(--brand-gold-deep)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                        <h2 class="font-script font-bold text-brand-green-text leading-none m-0">All Products</h2>
                        <svg viewBox="0 0 40 40" class="h-6 w-6" style="transform: scaleX(-1)" aria-hidden="true" fill="none" stroke="var(--brand-gold-deep)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                    </div>
                    <div class="pointer-events-none absolute ref-shop-doodle-left hidden md-flex items-center gap-1">
                        <span class="font-script text-2xl leading-tight text-handwrite">Pick Your Favourite</span>
                        <svg viewBox="0 0 60 60" class="h-12 w-12 text-handwrite" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8C22 14 34 26 40 46" /><path d="M28 44l12 4 3 -12" /></svg>
                    </div>
                </div>

                <label class="flex items-center gap-2 text-sm">
                    <span class="font-semibold text-brand-ink-70">Sort by:</span>
                    <span class="relative">
                        <select id="sort-select" class="ref-sort-select appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-sm font-semibold text-brand-ink focus-outline-none focus-ring-2 focus-ring-brand-gold-50">
                            <option value="default">Featured</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                        </select>
                        <svg class="pointer-events-none absolute ref-select-chevron text-brand-green" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                </label>
            </div>

            <div class="flex flex-col lg-flex-row gap-6">
                <!-- Sidebar -->
                <aside class="w-full shrink-0 rounded-2xl border border-border bg-sidebar p-5 lg-w-64 ref-sidebar">
                    <label for="search-input" class="visually-hidden" style="position:absolute; width:1px; height:1px; overflow:hidden;">Search Products</label>
                    <input type="text" id="search-input" class="search-input ref-search-sidebar mb-4" placeholder="🔍 Search products..." />

                    <button class="category-tab active w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left font-bold transition-colors ref-cat-btn" data-category="all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                        All Products (15)
                    </button>
                    <ul class="mb-6 ref-cat-list mt-2">
                        <li>
                            <button class="category-tab w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left font-semibold transition-colors ref-cat-link" data-category="achar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                                Pickles (9)
                            </button>
                        </li>
                        <li>
                            <button class="category-tab w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left font-semibold transition-colors ref-cat-link" data-category="murabba">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m9.5 7.5-2 2a4.95 4.95 0 1 0 7 7l2-2a4.95 4.95 0 1 0-7-7Z"/><path d="M14 6.5v10"/><path d="M10 7.5v10"/><path d="m16 7 1-5 1.367.683A3 3 0 0 0 19.708 3H21v1.292a3 3 0 0 0 .317 1.341L22 7l-5 1Z"/><path d="m11 21.2 5.714-5.714"/><path d="M14 19.5 19.5 14"/></svg>
                                Murabba (2)
                            </button>
                        </li>
                        <li>
                            <button class="category-tab w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left font-semibold transition-colors ref-cat-link" data-category="sweets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="m9.5 7.5-2 2a4.95 4.95 0 1 0 7 7l2-2a4.95 4.95 0 1 0-7-7Z"/><path d="M14 6.5v10"/><path d="M10 7.5v10"/><path d="m16 7 1-5 1.367.683A3 3 0 0 0 19.708 3H21v1.292a3 3 0 0 0 .317 1.341L22 7l-5 1Z"/><path d="m11 21.2 5.714-5.714"/><path d="M14 19.5 19.5 14"/></svg>
                                Sweets (2)
                            </button>
                        </li>
                        <li>
                            <button class="category-tab w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-left font-semibold transition-colors ref-cat-link" data-category="health">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                                Health Products (2)
                            </button>
                        </li>
                    </ul>

                    <div class="mb-5 flex items-center gap-2 border-t border-sidebar-border pt-5 font-bold text-brand-ink">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                        Filter by
                    </div>

                    <p class="mb-2 font-bold text-brand-ink">Price</p>
                    <ul class="mb-5 space-y-2 ref-filters">
                        <li><label class="flex cursor-pointer items-center gap-2 text-sm text-brand-ink-80"><input type="checkbox" class="h-4 w-4 accent-brand-green" />Under ₹200</label></li>
                        <li><label class="flex cursor-pointer items-center gap-2 text-sm text-brand-ink-80"><input type="checkbox" class="h-4 w-4 accent-brand-green" />₹200 – ₹400</label></li>
                        <li><label class="flex cursor-pointer items-center gap-2 text-sm text-brand-ink-80"><input type="checkbox" class="h-4 w-4 accent-brand-green" />₹401 – ₹600</label></li>
                        <li><label class="flex cursor-pointer items-center gap-2 text-sm text-brand-ink-80"><input type="checkbox" class="h-4 w-4 accent-brand-green" />Above ₹600</label></li>
                    </ul>

                    <p class="mb-2 font-bold text-brand-ink">Availability</p>
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-brand-ink-80">
                        <input type="checkbox" class="h-4 w-4 accent-brand-green" />
                        In Stock
                    </label>
                </aside>

                <!-- Grid -->
                <div class="flex-1">
                    <div class="grid grid-cols-1 sm-grid-cols-2 xl-grid-cols-3 gap-5" id="product-grid-container">
"""

for c in cards_data:
    cat_text = {
        'achar': 'Pickles',
        'murabba': 'Murabba',
        'sweets': 'Sweets',
        'health': 'Health Products'
    }.get(c['cat'], 'Pickles')

    card_html = f"""
                        <div class="product-card ref-product-card" data-category="{c['cat']}" data-product-id="{c['id']}">
                            <div class="ref-product-card-top relative">
                                <span class="ref-product-badge absolute top-3 left-3">{c['badge']}</span>
                                <a href="product-details.html?id={c['id']}" class="block overflow-hidden rounded-t-2xl">
                                  <img src="{c['img']}" alt="{c['alt']}" class="product-img ref-product-img w-full" loading="lazy" />
                                </a>
                            </div>
                            <div class="ref-product-card-body p-4 flex flex-col h-full">
                                <a href="product-details.html?id={c['id']}" class="block text-brand-ink hover:text-brand-green">
                                  <h3 class="product-title font-bold text-lg leading-tight mb-1">{c['title']}</h3>
                                </a>
                                <p class="text-xs font-semibold text-brand-green opacity-80 uppercase tracking-wide mb-3">{cat_text}</p>
                                
                                <div class="mt-auto">
                                    <div class="product-hindi-title hidden">{c['hindi']}</div>
                                    <div class="product-price-row flex items-baseline gap-2 mb-3">
                                        <span class="price-val font-bold text-xl text-brand-ink">{c['price']}</span>
                                        <span class="mrp-val text-sm text-muted-foreground line-through">{c['mrp']}</span>
                                        <span class="savings-tag text-xs font-bold text-brand-green border border-brand-green px-1.5 py-0.5 rounded ml-auto">{c['savings']}</span>
                                    </div>
                                    <div class="flex items-center gap-1 mb-4 text-xs font-bold text-brand-gold-deep">
                                        <span>{c['rating']}</span>
                                    </div>
                                    
                                    <button class="btn-add-cart ref-add-btn w-full flex items-center justify-center gap-2" data-product-id="{c['id']}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                                        Add to Cart
                                    </button>
                                    <a href="product-details.html?id={c['id']}" class="btn-view-details hidden">View</a>
                                </div>
                            </div>
                        </div>
"""
    shop_html += card_html

shop_html += """
                    </div>
                </div>
            </div>
        </section>
"""

trust_footer = """
    <!-- TRUST FOOTER BAR -->
    <div class="ref-trust-bar relative mt-16">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="ref-wavy-divider ref-trust-wavy" aria-hidden="true">
            <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--brand-green-deep)"/>
        </svg>
        <div class="ref-trust-bar-inner bg-brand-green-deep py-12 relative overflow-hidden">
            <svg viewBox="0 0 120 120" class="ref-leaf-spray absolute left-[-20px] top-4 h-32 w-32 opacity-30 ref-flip" aria-hidden="true" fill="none">
                <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
                <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>
            <svg viewBox="0 0 120 120" class="ref-leaf-spray absolute right-[-20px] top-4 h-32 w-32 opacity-30" aria-hidden="true" fill="none">
                <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
                <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
            </svg>

            <div class="ref-trust-grid max-w-1400 mx-auto px-4 md-px-8 flex flex-col md-flex-row justify-center items-center gap-8 md-gap-16 relative z-10 text-white">
                <div class="ref-trust-item flex flex-col items-center gap-3">
                    <svg class="w-10 h-10 text-brand-gold-accent" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                    <span class="font-bold text-lg tracking-wide uppercase">100% Homemade</span>
                </div>
                <div class="hidden md-block w-px h-16 bg-white opacity-20"></div>
                <div class="ref-trust-item flex flex-col items-center gap-3">
                    <svg class="w-10 h-10 text-brand-gold-accent" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4.97 0-9-1.8-9-4s4.03-4 9-4 9 1.8 9 4-4.03 4-9 4z"/><path d="M12 14c-4.97 0-9-1.8-9-4s4.03-4 9-4 9 1.8 9 4-4.03 4-9 4z"/><path d="M12 6c-4.97 0-9-1.8-9-4s4.03-4 9-4 9 1.8 9 4-4.03 4-9 4z"/></svg>
                    <span class="font-bold text-lg tracking-wide uppercase">Indian Tradition</span>
                </div>
                <div class="hidden md-block w-px h-16 bg-white opacity-20"></div>
                <div class="ref-trust-item flex flex-col items-center gap-3">
                    <svg class="w-10 h-10 text-brand-gold-accent" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    <span class="font-bold text-lg tracking-wide uppercase">For a Healthier You</span>
                </div>
            </div>
        </div>
    </div>
"""

# Replace breadcrumbs to end of catalog with new HTML
html_part1, html_part2 = html.split('<!-- BREADCRUMBS -->', 1)
# We need to find the end of the <main> block, but the catalog is inside <main>.
# Actually, it's easier to find <!-- BREADCRUMBS --> up to </main>.
_, html_part2_after_main = html.split('</main>', 1)
new_html = html_part1 + hero_html + '\n    <main id="main-content" class="page-container" role="main" style="max-width: 1400px; margin: 0 auto; padding: 0 0 80px;">\n' + shop_html + '\n    </main>\n' + html_part2_after_main

# Inject trust footer before <footer class="site-footer"
html_before_footer, html_after_footer = new_html.split('<!-- SITE FOOTER -->', 1)
new_html = html_before_footer + trust_footer + '\n    <!-- SITE FOOTER -->\n' + html_after_footer

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Updated products.html")
