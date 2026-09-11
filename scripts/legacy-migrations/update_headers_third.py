import os
import re

html_files = [
    r'u:\SatvikSwad\public\site\products.html',
    r'u:\SatvikSwad\public\site\our-story.html',
    r'u:\SatvikSwad\public\site\reviews.html',
    r'u:\SatvikSwad\public\site\faq.html',
    r'u:\SatvikSwad\public\site\contact.html',
    r'u:\SatvikSwad\public\site\profile.html'
]

# Exact header from index.html
new_header_template = """<header class="site-header" role="banner">
  <div class="header-container ref-header">
    <a href="index.html" class="logo-group" aria-label="Satvik Swaad home">
      <span class="ref-logo-ring">
        <img src="assets/logo.png" alt="Satvik Swaad" class="ref-logo-img" />
      </span>
    </a>
    <nav class="main-nav ref-nav">
      <a href="index.html" class="nav-link">Home</a>
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
  </div>

  <!-- HEADER DROPDOWN MENU (COMPACT, NON-BLURRING, PROFESSIONAL) -->
  <div class="header-dropdown-menu" id="header-dropdown-menu" role="menu" aria-label="Navigation Menu">
      <button type="button" class="dropdown-nav-link btn-lang-toggle mobile-lang-toggle" id="mobile-lang-toggle" style="background:none; border:none; text-align:left; cursor:pointer; width:100%; display:flex; align-items:center; gap:8px;" role="menuitem">
          <span class="lang-icon">🌐</span> <span class="lang-toggle-text">हिन्दी / English</span>
      </button>
      <a href="index.html#hero" class="dropdown-nav-link active" role="menuitem">🏠 Home</a>
      <a href="products.html#catalog" class="dropdown-nav-link" role="menuitem">🛍️ Products (15)</a>
      <a href="why-us.html" class="dropdown-nav-link" role="menuitem">✨ Why Us</a>
      <a href="our-story.html#about" class="dropdown-nav-link" role="menuitem">📜 Our Story</a>
      <a href="reviews.html" class="dropdown-nav-link" role="menuitem">⭐ Customer Reviews</a>
      <a href="faq.html" class="dropdown-nav-link" role="menuitem">❓ FAQ</a>
      <a href="contact.html" class="dropdown-nav-link" role="menuitem">📞 Contact Us</a>
      <a href="profile.html" class="dropdown-nav-link profile-link" id="mobile-nav-profile" role="menuitem">👤 My Account & Orders</a>
  </div>
</header>"""

for filepath in html_files:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    active_products = ' active' if 'products.html' in filepath else ''
    active_story = ' active' if 'our-story.html' in filepath else ''
    active_why = ' active' if 'reviews.html' in filepath else ''
    active_contact = ' active' if 'contact.html' in filepath else ''

    new_header = new_header_template.format(
        active_products=active_products,
        active_story=active_story,
        active_why=active_why,
        active_contact=active_contact
    )

    pattern = r'<header class="site-header" role="banner">.*?</header>'
    new_content = re.sub(pattern, new_header, content, flags=re.DOTALL)
    
    if new_content == content:
        print(f"No changes made to {filepath}")
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated header in {filepath}")

print("Header restoration completed.")
