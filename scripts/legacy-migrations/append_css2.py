css_content = """
/* =========================================================
   PHASE 7 & 8: FAQ AND CONTACT PAGE STYLES
   ========================================================= */

/* Hero Banner */
.hero-banner-section {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: var(--color-bg);
}
.hero-bg-container {
    position: relative;
    width: 100%;
    height: 360px;
}
@media (max-width: 768px) {
    .hero-bg-container {
        height: 300px;
    }
}
.hero-bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, rgba(0, 40, 20, 0.75), rgba(0, 40, 20, 0.25), transparent);
}
.hero-corner-fold {
    position: absolute;
    top: 0;
    right: 0;
    width: 96px;
    height: 96px;
}
.corner-triangle {
    width: 100%;
    height: 100%;
    background-color: var(--color-green-deep, #083017);
    clip-path: polygon(100% 0, 0 0, 100% 100%);
}
.corner-leaf {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 40px;
    height: 40px;
    opacity: 0.8;
}

.hero-content {
    position: relative;
    z-index: 10;
    display: flex;
    height: 100%;
    max-width: 1500px;
    margin: 0 auto;
    align-items: center;
    padding: 0 48px;
}
@media (max-width: 768px) {
    .hero-content {
        padding: 0 24px;
    }
}
.hero-title {
    font-family: 'Caveat', cursive;
    line-height: 0.85;
    margin: 0;
}
.title-top {
    display: block;
    font-size: 3.75rem;
    color: #F8F9F8;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}
@media (max-width: 768px) {
    .title-top {
        font-size: 2.5rem;
    }
}
.title-script-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 4.5rem;
    color: var(--color-saffron);
    margin-top: 8px;
}
@media (max-width: 768px) {
    .title-script-wrapper {
        font-size: 3rem;
    }
}
.hero-subtitle {
    margin-top: 16px;
    font-family: 'Caveat', cursive;
    font-size: 1.875rem;
    color: #F0F4F2;
}
@media (max-width: 768px) {
    .hero-subtitle {
        font-size: 1.5rem;
    }
}

.hero-products-right {
    position: absolute;
    bottom: 0;
    right: 24px;
    z-index: 10;
    display: flex;
    align-items: flex-end;
    pointer-events: none;
}
.hero-product-1 {
    width: 160px;
    height: 160px;
    transform: translateY(12px);
}
.hero-product-1 img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
}
.hero-product-2 {
    width: 192px;
    height: 256px;
}
.hero-product-2 img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 20px 25px rgba(0,0,0,0.3));
}

.hero-paper-note {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 20;
    width: 160px;
    background: #FFFCE8;
    padding: 16px 20px;
    box-shadow: 0 6px 18px -6px rgba(60,50,20,0.35);
    clip-path: polygon(3% 0, 97% 2%, 100% 96%, 96% 100%, 4% 98%, 0 92%, 1% 6%);
}
.note-tape {
    position: absolute;
    top: 0;
    left: 50%;
    width: 64px;
    height: 20px;
    background: rgba(220, 215, 205, 0.7);
    transform: translate(-50%, -50%) rotate(-4deg);
}
.hero-paper-note p {
    font-family: 'Caveat', cursive;
    font-size: 1.25rem;
    line-height: 1.1;
    color: #4A4036;
    margin: 0;
}

.hero-right-doodle {
    position: absolute;
    top: 32px;
    right: 24px;
    z-index: 20;
    text-align: right;
}
.doodle-text {
    font-family: 'Caveat', cursive;
    font-size: 1.5rem;
    line-height: 1.1;
    color: #F8F9F8;
}

.hero-wavy {
    margin-top: -32px;
    height: 32px;
    position: relative;
    z-index: 10;
}
@media (min-width: 768px) {
    .hero-wavy {
        margin-top: -48px;
        height: 48px;
    }
}

/* Page Layout Grids */
.faq-layout, .contact-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
}
@media (min-width: 1024px) {
    .faq-layout {
        grid-template-columns: 260px 1fr auto;
    }
    .contact-layout {
        grid-template-columns: 320px 1fr auto;
    }
}

/* Sidebar & Cards */
.faq-sidebar {
    background: #F8F5F0;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 16px;
    height: fit-content;
}
.category-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.category-btn {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    border: none;
    background: transparent;
    text-align: left;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;
}
.category-btn:hover {
    background: #EAE3D9;
}
.category-btn.active {
    background: var(--color-green);
    color: white;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.category-btn.active .cat-icon {
    color: white;
}
.cat-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.cat-label {
    flex: 1;
}

/* Contact Info Card */
.contact-info-card {
    background: rgba(248, 245, 240, 0.5);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 24px;
    height: fit-content;
}
.info-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
}
.info-item {
    display: flex;
    gap: 16px;
}
.info-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--color-green);
    color: white;
}
.info-title {
    font-weight: 700;
    color: var(--color-green);
    margin: 0 0 4px 0;
}
.info-line {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: rgba(60, 50, 40, 0.75);
}

/* Form Area */
.contact-form-block {
    background: rgba(248, 245, 240, 0.4);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 24px;
}
@media (min-width: 768px) {
    .contact-form-block {
        padding: 32px;
    }
}
.form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}
@media (min-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr 1fr;
    }
}
.form-field {
    display: block;
}
.field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-green);
}
.required {
    color: #dc2626;
}
.ss-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #D5C9B3;
    border-radius: 8px;
    background: white;
    font-family: inherit;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.ss-input:focus {
    outline: none;
    border-color: var(--color-green);
    box-shadow: 0 0 0 2px rgba(12, 69, 36, 0.2);
}
.resize-none {
    resize: none;
}
.select-wrapper {
    position: relative;
    display: block;
}
.select-wrapper select {
    appearance: none;
    padding-right: 40px;
}
.select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--color-green);
}

.btn-send-message {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 9999px;
    background: var(--color-saffron);
    color: white;
    padding: 12px 28px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: all 0.2s;
}
.btn-send-message:hover {
    background: #D96000;
    transform: translateY(-1px);
}
.btn-send-message:active {
    transform: scale(0.98);
}

/* Accordion Area */
.script-title-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}
.script-title {
    font-family: 'Caveat', cursive;
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1;
    margin: 0;
}
@media (min-width: 768px) {
    .script-title {
        font-size: 3rem;
    }
}
.sparkle-mark {
    width: 24px;
    height: 24px;
}
.faq-accordion-subtitle, .contact-subtitle {
    margin-top: 4px;
    margin-bottom: 24px;
    color: rgba(60, 50, 40, 0.7);
}

.faq-item {
    background: rgba(248, 245, 240, 0.4);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
}
.faq-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    font-family: 'Caveat', cursive;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-green);
    cursor: pointer;
    list-style: none;
}
.faq-summary::-webkit-details-marker {
    display: none;
}
.faq-summary .chevron {
    color: var(--color-green);
    transition: transform 0.3s ease;
}
.faq-item[open] .chevron {
    transform: rotate(180deg);
}
.faq-content {
    padding: 0 20px 16px 20px;
    color: rgba(60, 50, 40, 0.8);
    line-height: 1.6;
}

/* Polaroid */
.polaroid-column {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}
@media (min-width: 1280px) {
    .polaroid-column {
        display: flex;
    }
}
.polaroid-card {
    position: relative;
    width: fit-content;
    background: #FAFAFA;
    padding: 12px 12px 20px 12px;
    box-shadow: 0 14px 36px -14px rgba(60,50,20,0.5);
    margin: 0;
}
.tape {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 25px;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    z-index: 10;
}
.polaroid-img-wrapper {
    position: relative;
    width: 224px;
    aspect-ratio: 4/5;
    overflow: hidden;
}
@media (min-width: 768px) {
    .polaroid-img-wrapper {
        width: 256px;
    }
}
.polaroid-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.polaroid-caption {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-family: 'Caveat', cursive;
    font-size: 1.5rem;
    line-height: 1.1;
    color: #4A4036;
}

/* Utilities */
.text-white { color: #ffffff !important; }
.text-gold { color: var(--color-saffron) !important; }
.text-green { color: var(--color-green) !important; }
.bg-green { background: var(--color-green) !important; }
.block { display: block; }
.hidden-mobile { display: none; }
@media (min-width: 640px) { .hidden-mobile { display: block; } }
@media (min-width: 1024px) { .hidden-mobile { display: flex; } }
"""

with open(r"u:\SatvikSwad\public\site\style.css", "a", encoding="utf-8") as f:
    f.write(css_content)

print("CSS appended.")
