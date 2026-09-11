import os
import re

html_files = [
    r'u:\SatvikSwad\public\site\index.html',
    r'u:\SatvikSwad\public\site\products.html',
    r'u:\SatvikSwad\public\site\our-story.html',
    r'u:\SatvikSwad\public\site\reviews.html',
    r'u:\SatvikSwad\public\site\faq.html',
    r'u:\SatvikSwad\public\site\contact.html',
    r'u:\SatvikSwad\public\site\profile.html'
]

new_font_link = '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=DM+Serif+Display&family=Playfair+Display:wght@700;900&family=Lato:wght@400;700;900&display=swap" rel="stylesheet" />'

header_template = """  <div class="header-container ref-header">
    <a href="index.html" class="logo-group" aria-label="Satvik Swaad home">
      <span class="ref-logo-ring">
        <img src="assets/logo.png" alt="Satvik Swaad" class="ref-logo-img" />
      </span>
    </a>
    <nav class="main-nav ref-nav">
      <a href="index.html" class="nav-link{active_home}">Home</a>
      <a href="products.html" class="nav-link{active_products}">Shop</a>
      <a href="our-story.html" class="nav-link{active_story}">Our Story</a>
      <a href="why-us.html" class="nav-link{active_why}">Health & Purity</a>
      <a href="index.html#comparison" class="nav-link">Comparison</a>
      <a href="contact.html" class="nav-link{active_contact}">Contact</a>
    </nav>
    <div class="header-right-actions">
      <!-- Hidden but preserved for JS -->
      <button type="button" class="btn-lang-toggle" id="btn-lang-toggle" style="display:none;">हिन्दी</button>
      <div class="ref-search-bar">
        <input type="search" placeholder="Search for pickles, sweets..." class="ref-search-input" />
        <svg class="ref-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <a href="profile.html" id="btn-open-profile" class="ref-icon-btn" aria-label="My profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </a>
      <button type="button" id="btn-open-cart" class="ref-icon-btn" aria-label="Open cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span class="ref-cart-badge" id="cart-count-badge">0</span>
      </button>
      <button type="button" id="mobile-menu-btn" class="ref-mobile-menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </div>"""

for filepath in html_files:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update fonts
    content = re.sub(r'<link href="https://fonts.googleapis.com/css2\?[^"]+" rel="stylesheet" />', new_font_link, content)

    # Determine active link
    active_home = ' active' if 'index.html' in filepath else ''
    active_products = ' active' if 'products.html' in filepath else ''
    active_story = ' active' if 'our-story.html' in filepath else ''
    active_why = ' active' if 'why-us.html' in filepath else ''
    active_contact = ' active' if 'contact.html' in filepath else ''

    new_header_inner = header_template.format(
        active_home=active_home,
        active_products=active_products,
        active_story=active_story,
        active_why=active_why,
        active_contact=active_contact
    )

    pattern = r'<div class="header-container">.*?</div>\s*<!-- HEADER DROPDOWN MENU'
    content = re.sub(pattern, new_header_inner + '\n\n        <!-- HEADER DROPDOWN MENU', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("HTML updates completed.")
