import os
import re

pages_config = [
    {
        'file': 'products.html',
        'pattern': r'<!-- HERO BANNER \(EXACT REFERENCE REPLICA\) -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': '''<!-- BREADCRUMBS -->
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <div class="breadcrumb-inner">
            <a href="index.html">Home</a>
            <span class="separator">›</span>
            <span class="current">All Products</span>
        </div>
    </nav>'''
    },
    {
        'file': 'product-details.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'our-story.html',
        'pattern': r'<!-- HERO BANNER \(EXACT REFERENCE REPLICA\) -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': '''<!-- BREADCRUMBS -->
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <div class="breadcrumb-inner">
            <a href="index.html">Home</a>
            <span class="separator">›</span>
            <span class="current">Our Story</span>
        </div>
    </nav>'''
    },
    {
        'file': 'why-us.html',
        'pattern': r'<!-- HERO BANNER \(EXACT REFERENCE REPLICA\) -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': '''<!-- BREADCRUMBS -->
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <div class="breadcrumb-inner">
            <a href="index.html">Home</a>
            <span class="separator">›</span>
            <span class="current">Health &amp; Purity</span>
        </div>
    </nav>'''
    },
    {
        'file': 'profile.html',
        'pattern': r'<!-- HERO BANNER \(EXACT REFERENCE REPLICA\) -->\s*<section class="ref-shop-hero-section relative isolate"[^>]*>[\s\S]*?<\/section>',
        'replacement': '''<!-- BREADCRUMBS -->
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <div class="breadcrumb-inner">
            <a href="index.html">Home</a>
            <span class="separator">›</span>
            <span class="current">My Profile</span>
        </div>
    </nav>'''
    },
    {
        'file': 'contact.html',
        'pattern': r'<!-- A\) HERO BANNER -->\s*<section class="hero-banner-section isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'faq.html',
        'pattern': r'<!-- A\) HERO BANNER -->\s*<section class="hero-banner-section isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'reviews.html',
        'pattern': r'<!-- HERO BANNER -->\s*<section class="hero-banner-section">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'cancellation-refund-policy.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'shipping-delivery-policy.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'privacy-policy.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'terms-and-conditions.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    },
    {
        'file': 'cookies-policy.html',
        'pattern': r'<!-- SIGNATURE HERO BANNER -->\s*<section class="ref-shop-hero-section relative isolate">[\s\S]*?<\/section>',
        'replacement': ''
    }
]

for item in pages_config:
    fpath = os.path.join('public', 'site', item['file'])
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = list(re.finditer(item['pattern'], content))
    print(f"{item['file']}: found {len(matches)} match(es)")
    if len(matches) == 1:
        new_content = re.sub(item['pattern'], item['replacement'], content, count=1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  -> Successfully updated {item['file']}")
    else:
        print(f"  -> WARNING: Expected 1 match, found {len(matches)}")
