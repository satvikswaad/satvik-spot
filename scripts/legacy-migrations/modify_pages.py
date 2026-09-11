import re
import sys

def modify_file(filepath, new_main_content):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Hide ticker
        content = content.replace(
            '<div class="announcement-ticker" aria-label="Satvik Swaad announcements">',
            '<div class="announcement-ticker" aria-label="Satvik Swaad announcements" style="display: none;">'
        )

        # Replace main block
        pattern_main = re.compile(r'<main id="main-content".*?</main>', re.DOTALL)
        content = pattern_main.sub(new_main_content, content)

        # Add green wave above footer if not present
        if '<footer class="site-footer"' in content and 'class="wavy-divider trust-wave"' not in content:
            wave = """    <!-- GREEN WAVE TRUST BAR -->
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="wavy-divider trust-wave" aria-hidden="true" style="transform: scaleY(-1); background: transparent; display: block;">
        <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="#0C4524" />
    </svg>
    <div style="background: #0C4524; height: 10px; width: 100%;"></div>

    <footer class="site-footer\""""
            content = content.replace('<footer class="site-footer"', wave)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully updated {filepath}")
    except Exception as e:
        print(f"Failed to update {filepath}: {e}")

faq_main = r'''    <main id="main-content" class="page-container paper-texture" role="main">
        <!-- A) HERO BANNER -->
        <section class="hero-banner-section isolate">
            <div class="hero-bg-container">
                <img src="assets/village-hero.png" alt="" class="hero-bg-image" />
                <div class="hero-overlay"></div>

                <div class="hero-corner-fold">
                    <div class="corner-triangle"></div>
                    <svg class="leaf-spray corner-leaf" viewBox="0 0 120 120" style="transform: scaleX(-1);">
                        <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--color-green)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
                        <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                    </svg>
                </div>

                <div class="hero-content">
                    <div class="animate-fade-up">
                        <h1 class="hero-title">
                            <span class="title-top text-white">Frequently Asked</span>
                            <span class="title-script-wrapper">
                                <span class="brush-underline text-gold">Questions</span>
                                <svg viewBox="0 0 32 30" class="heart-doodle text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                            </span>
                        </h1>
                        <p class="hero-subtitle">
                            <span class="brush-underline">We're here to help!</span>
                        </p>
                    </div>
                </div>

                <div class="hero-products-right hidden-mobile">
                    <div class="hero-product-1"><img src="assets/pickle-bowl.png" alt="" /></div>
                    <div class="hero-product-2"><img src="assets/hara-mirch-jar.png" alt="Satvik Swaad Hara Mirch Pickle jar" /></div>
                </div>

                <div class="hero-paper-note hidden-mobile" style="transform: rotate(-7deg);">
                    <span class="note-tape"></span>
                    <p>Got Questions? We've Got Answers!</p>
                </div>

                <div class="hero-right-doodle hidden-mobile">
                    <span class="doodle-text block">Pure</span>
                    <span class="doodle-text block">Desi</span>
                    <span class="doodle-text block">Goodness</span>
                    <svg viewBox="0 0 32 30" class="heart-doodle text-white ml-auto" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: auto; margin-top: 4px;"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                </div>
            </div>

            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="wavy-divider hero-wavy" aria-hidden="true">
                <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--color-bg)" />
            </svg>
        </section>

        <!-- B) FAQ CONTENT -->
        <section class="faq-content-section" style="max-width: 1400px; margin: 0 auto; padding: 40px 16px;">
            <div class="faq-layout">
                <!-- Sidebar -->
                <aside class="faq-sidebar">
                    <ul class="category-list">
                        <li><button class="category-btn active" data-target="cat-general"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span> <span class="cat-label">General</span> <span class="cat-arrow">→</span></button></li>
                        <li><button class="category-btn" data-target="cat-orders"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></span> <span class="cat-label">Orders & Shipping</span></button></li>
                        <li><button class="category-btn" data-target="cat-products"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></span> <span class="cat-label">Products & Ingredients</span></button></li>
                        <li><button class="category-btn" data-target="cat-payments"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg></span> <span class="cat-label">Payments & Refunds</span></button></li>
                        <li><button class="category-btn" data-target="cat-account"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg></span> <span class="cat-label">Account & Profile</span></button></li>
                        <li><button class="category-btn" data-target="cat-others"><span class="cat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></span> <span class="cat-label">Others</span></button></li>
                    </ul>
                </aside>

                <!-- Accordion -->
                <div class="faq-accordion-area">
                    <div class="script-title-wrapper" style="justify-content: flex-start; gap: 12px; margin-bottom: 4px;">
                        <svg viewBox="0 0 40 40" class="sparkle-mark" fill="none" stroke="var(--color-saffron)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                        <h2 class="script-title text-green">Common Questions</h2>
                        <svg viewBox="0 0 40 40" class="sparkle-mark" fill="none" stroke="var(--color-saffron)" stroke-width="3" stroke-linecap="round" style="transform: scaleX(-1);"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                    </div>
                    <p class="faq-accordion-subtitle" style="margin-bottom: 24px;">Find quick answers to your most asked questions.</p>

                    <div style="margin-bottom: 0px; display: none;">
                        <label for="faq-search-input" class="visually-hidden" style="position:absolute; width:1px; height:1px; overflow:hidden;">Search Frequently Asked Questions</label>
                        <input type="text" id="faq-search-input" class="search-input" placeholder="🔍 Search questions..." />
                    </div>

                    <div class="faq-items-container" id="cat-general">
                        <details class="faq-item" open>
                            <summary class="faq-summary">Are your products 100% natural? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Yes. Every Satvik Swaad product is made with pure, natural ingredients — no synthetic colours, flavours or preservatives, ever.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">How long does delivery take? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Orders are typically dispatched within 24–48 hours and delivered within 3–7 business days depending on your location.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">Can I track my order? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Absolutely. Once your order ships, you will receive a tracking link by email and SMS. You can also track it from your profile.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">What is your return and refund policy? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">If a product arrives damaged or you are not satisfied, reach out within 7 days of delivery for a replacement or full refund.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">Do you offer COD (Cash on Delivery)? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Yes, Cash on Delivery is available across most serviceable pin codes in India at checkout.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">Are your products safe for children? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Our sweets and health products are family-friendly. Pickles are spiced traditionally, so we recommend mild options for young children.</div>
                        </details>
                    </div>
                    <div class="faq-items-container" id="cat-orders" style="display: none;">
                        <details class="faq-item">
                            <summary class="faq-summary">Do you ship across India? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Yes, we ship to serviceable pin codes across India. International shipping is coming soon.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">What are the shipping charges? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Shipping is free on orders above ₹499. A small flat fee applies to smaller orders.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">Can I change my delivery address? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">You can update your address from your profile before the order is dispatched.</div>
                        </details>
                    </div>
                    <div class="faq-items-container" id="cat-products" style="display: none;">
                        <details class="faq-item">
                            <summary class="faq-summary">What oil do you use in pickles? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">We use pure cold-pressed mustard oil, rich in flavour and free from harmful chemicals.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">How should I store the pickles? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Store in a cool, dry place away from direct sunlight and always use a clean, dry spoon.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">What is the shelf life? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Pickles stay fresh for up to 12 months; sweets are best enjoyed within 15–30 days.</div>
                        </details>
                    </div>
                    <div class="faq-items-container" id="cat-payments" style="display: none;">
                        <details class="faq-item">
                            <summary class="faq-summary">Which payment methods do you accept? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">UPI, all major cards, net banking, popular wallets, and Cash on Delivery.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">How long do refunds take? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Approved refunds are processed within 5–7 business days to your original payment method.</div>
                        </details>
                    </div>
                    <div class="faq-items-container" id="cat-account" style="display: none;">
                        <details class="faq-item">
                            <summary class="faq-summary">How do I create an account? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">You can sign up with your email or continue with your Google account in seconds.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">Can I save multiple addresses? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Yes, add and manage multiple delivery addresses from your profile.</div>
                        </details>
                    </div>
                    <div class="faq-items-container" id="cat-others" style="display: none;">
                        <details class="faq-item">
                            <summary class="faq-summary">Do you take bulk / gifting orders? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">Yes! Reach out via our Contact page for bulk, corporate and festive gifting orders.</div>
                        </details>
                        <details class="faq-item">
                            <summary class="faq-summary">How can I partner with Satvik Swaad? <span class="chevron"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></summary>
                            <div class="faq-content">We love collaborations. Drop us a message through the Contact page and our team will connect with you.</div>
                        </details>
                    </div>
                </div>

                <!-- Right Polaroid -->
                <div class="polaroid-column hidden-mobile">
                    <figure class="polaroid-card" style="transform: rotate(-3deg);">
                        <span class="tape"></span>
                        <div class="polaroid-img-wrapper">
                            <img src="assets/mother-child.png" alt="" />
                        </div>
                        <figcaption class="polaroid-caption">
                            <span class="brush-underline">Maa ke swaad ki virasat</span>
                            <svg viewBox="0 0 32 30" class="heart-doodle" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                        </figcaption>
                    </figure>
                    <div class="doodle-group" style="display: flex; gap: 8px;">
                        <div class="doodle-text-lines text-right" style="margin-top: 10px;">
                            <span class="doodle-text block">Same</span>
                            <span class="doodle-text block">Love</span>
                            <span class="doodle-text block">Since</span>
                            <span class="doodle-text block">Generations</span>
                            <svg viewBox="0 0 32 30" class="heart-doodle doodle-right text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: auto; margin-top: 4px;"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                        </div>
                        <svg viewBox="0 0 60 60" class="arrow-doodle scale-x-flip" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8C22 14 34 26 40 46" /><path d="M28 44l12 4 3 -12" /></svg>
                    </div>
                </div>
            </div>
        </section>
        
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const buttons = document.querySelectorAll('.category-btn');
                const containers = document.querySelectorAll('.faq-items-container');

                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        buttons.forEach(b => {
                            b.classList.remove('active');
                            const arrow = b.querySelector('.cat-arrow');
                            if(arrow) arrow.remove();
                            b.classList.remove('bg-green', 'text-white');
                        });
                        btn.classList.add('active', 'bg-green', 'text-white');
                        if(!btn.querySelector('.cat-arrow')) {
                            const arr = document.createElement('span');
                            arr.className = 'cat-arrow';
                            arr.textContent = '→';
                            btn.appendChild(arr);
                        }

                        const target = btn.getAttribute('data-target');
                        containers.forEach(c => {
                            c.style.display = (c.id === target) ? 'block' : 'none';
                        });
                    });
                });
            });
        </script>
    </main>'''

contact_main = r'''    <main id="main-content" class="page-container paper-texture" role="main">
        <!-- A) HERO BANNER -->
        <section class="hero-banner-section isolate">
            <div class="hero-bg-container">
                <img src="assets/village-hero.png" alt="" class="hero-bg-image" />
                <div class="hero-overlay"></div>

                <div class="hero-corner-fold">
                    <div class="corner-triangle"></div>
                    <svg class="leaf-spray corner-leaf" viewBox="0 0 120 120" style="transform: scaleX(-1);">
                        <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--color-green)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
                        <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                        <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--color-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--color-green)" opacity="0.72"/></g>
                    </svg>
                </div>

                <div class="hero-content">
                    <div class="animate-fade-up">
                        <h1 class="hero-title">
                            <span class="title-top text-white">Get in</span>
                            <span class="title-script-wrapper">
                                <span class="brush-underline text-gold">Touch</span>
                                <svg viewBox="0 0 32 30" class="heart-doodle text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                            </span>
                        </h1>
                        <p class="hero-subtitle">
                            <span class="brush-underline">We'd Love to Hear from You</span>
                        </p>
                    </div>
                </div>

                <div class="hero-paper-note hidden-mobile" style="transform: rotate(-6deg);">
                    <span class="note-tape"></span>
                    <p>Your Feedback Matters</p>
                </div>

                <div class="hero-right-doodle hidden-mobile">
                    <span class="doodle-text block">Pure</span>
                    <span class="doodle-text block">Desi</span>
                    <span class="doodle-text block">Goodness</span>
                    <svg viewBox="0 0 32 30" class="heart-doodle text-white ml-auto" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: auto; margin-top: 4px;"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                </div>
            </div>

            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="wavy-divider hero-wavy" aria-hidden="true">
                <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--color-bg)" />
            </svg>
        </section>

        <!-- B) CONTACT CONTENT -->
        <section class="contact-content-section" style="max-width: 1400px; margin: 0 auto; padding: 40px 16px;">
            <div class="contact-layout">
                <!-- Info card -->
                <aside class="contact-info-card">
                    <ul class="info-list">
                        <li class="info-item">
                            <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></span>
                            <div>
                                <p class="info-title">Our Address</p>
                                <p class="info-line">Satvik Swaad Pvt. Ltd.</p>
                                <p class="info-line">Village & Post – Kothapalli,</p>
                                <p class="info-line">Dist. – Nizamabad, Telangana – 503001</p>
                            </div>
                        </li>
                        <li class="info-item">
                            <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                            <div>
                                <p class="info-title">Phone</p>
                                <p class="info-line">+91 98765 43210</p>
                                <p class="info-line">(Mon – Sat, 9 AM – 6 PM)</p>
                            </div>
                        </li>
                        <li class="info-item">
                            <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
                            <div>
                                <p class="info-title">Email</p>
                                <p class="info-line">support@satvikswaad.com</p>
                            </div>
                        </li>
                        <li class="info-item">
                            <span class="info-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                            <div>
                                <p class="info-title">Business Hours</p>
                                <p class="info-line">Mon – Sat: 9 AM – 6 PM</p>
                                <p class="info-line">(Sunday Closed)</p>
                            </div>
                        </li>
                    </ul>
                </aside>

                <!-- Form -->
                <div class="contact-form-area">
                    <div class="script-title-wrapper" style="justify-content: flex-start; gap: 12px; margin-bottom: 4px;">
                        <svg viewBox="0 0 40 40" class="sparkle-mark" fill="none" stroke="var(--color-saffron)" stroke-width="3" stroke-linecap="round"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                        <h2 class="script-title text-green">Send Us a Message</h2>
                        <svg viewBox="0 0 40 40" class="sparkle-mark" fill="none" stroke="var(--color-saffron)" stroke-width="3" stroke-linecap="round" style="transform: scaleX(-1);"><path d="M8 20h14" /><path d="M10 10l9 6" /><path d="M10 30l9 -6" /></svg>
                    </div>
                    <p class="contact-subtitle" style="margin-bottom: 24px;">We are here to help! Fill out the form below and we'll get back to you soon.</p>

                    <form id="contact-form" class="contact-form-block">
                        <div class="form-grid">
                            <label class="form-field">
                                <span class="field-label">Name <span class="required">*</span></span>
                                <input type="text" id="contact-name" name="name" class="ss-input" required placeholder="Your name" />
                            </label>
                            <label class="form-field">
                                <span class="field-label">Email <span class="required">*</span></span>
                                <input type="email" id="contact-email" name="email" class="ss-input" required placeholder="your@email.com" />
                            </label>
                        </div>
                        
                        <label class="form-field" style="margin-top: 20px;">
                            <span class="field-label">Subject <span class="required">*</span></span>
                            <div class="select-wrapper">
                                <select id="contact-subject" name="subject" class="ss-input" required>
                                    <option value="" disabled selected>Select a subject</option>
                                    <option>General Enquiry</option>
                                    <option>Order Support</option>
                                    <option>Bulk / Gifting Order</option>
                                    <option>Feedback</option>
                                    <option>Partnership</option>
                                </select>
                                <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </label>

                        <label class="form-field" style="margin-top: 20px;">
                            <span class="field-label">Message <span class="required">*</span></span>
                            <textarea id="contact-message" name="message" class="ss-input resize-none" rows="5" required placeholder="Type your message here..."></textarea>
                        </label>

                        <button type="submit" id="btn-submit-contact" class="btn-send-message group mt-6" style="margin-top: 24px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                            Send Message
                        </button>
                        <div id="contact-success-msg" style="display: none; margin-top: 16px; color: var(--color-green); font-weight: bold;">
                            ✅ Thank you! Your message has been sent.
                        </div>
                    </form>
                </div>

                <!-- Right Polaroid -->
                <div class="polaroid-column hidden-mobile">
                    <figure class="polaroid-card" style="transform: rotate(-3deg);">
                        <span class="tape"></span>
                        <div class="polaroid-img-wrapper">
                            <img src="assets/mother-child.png" alt="" />
                        </div>
                        <figcaption class="polaroid-caption">
                            <span class="brush-underline">Maa ke swaad ki virasat</span>
                            <svg viewBox="0 0 32 30" class="heart-doodle text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                        </figcaption>
                    </figure>
                    <div class="doodle-group" style="display: flex; gap: 8px;">
                        <div class="doodle-text-lines text-right" style="margin-top: 10px;">
                            <span class="doodle-text block">Same</span>
                            <span class="doodle-text block">Love</span>
                            <span class="doodle-text block">Since</span>
                            <span class="doodle-text block">Generations</span>
                            <svg viewBox="0 0 32 30" class="heart-doodle doodle-right text-gold" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: auto; margin-top: 4px;"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                        </div>
                        <svg viewBox="0 0 60 60" class="arrow-doodle scale-x-flip" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8C22 14 34 26 40 46" /><path d="M28 44l12 4 3 -12" /></svg>
                    </div>
                </div>
            </div>
        </section>

        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const form = document.getElementById('contact-form');
                if(form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const msg = document.getElementById('contact-success-msg');
                        if(msg) msg.style.display = 'block';
                        form.reset();
                        setTimeout(() => { if(msg) msg.style.display = 'none'; }, 4000);
                    });
                }
            });
        </script>
    </main>'''

modify_file(r'u:\SatvikSwad\public\site\faq.html', faq_main)
modify_file(r'u:\SatvikSwad\public\site\contact.html', contact_main)
