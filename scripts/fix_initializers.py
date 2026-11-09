with open('public/site/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = """function runInitializers() {
    const safeRun = (fn, name) => {
        try { fn(); } catch (err) { console.warn(`Initializer "${name}" warning:`, err); }
    };
    safeRun(ensureModalsInDOM, 'ensureModalsInDOM');
    safeRun(initLanguage, 'initLanguage');
    safeRun(initUI, 'initUI');
    safeRun(initStickyHeader, 'initStickyHeader');
    safeRun(initUniversalSearch, 'initUniversalSearch');
    safeRun(initHeroSlider, 'initHeroSlider');
    safeRun(initScrollReveal, 'initScrollReveal');
    safeRun(initScrollToTop, 'initScrollToTop');
    safeRun(initMobileNav, 'initMobileNav');
    safeRun(initFaqSearch, 'initFaqSearch');
    safeRun(initProductsSort, 'initProductsSort');
    safeRun(initReviewsData, 'initReviewsData');
    safeRun(syncProductsWithStorage, 'syncProductsWithStorage');
    safeRun(initCustomerRatingsMarquee, 'initCustomerRatingsMarquee');
    safeRun(initSatvikStoryVideoPlayer, 'initSatvikStoryVideoPlayer');
    safeRun(initContactForm, 'initContactForm');
    safeRun(initProductDetailsPage, 'initProductDetailsPage');
    safeRun(initProfilePage, 'initProfilePage');
    safeRun(initReorderSection, 'initReorderSection');
    safeRun(initFloatingAgent, 'initFloatingAgent');
    safeRun(initFooterAccordion, 'initFooterAccordion');
    safeRun(renderCart, 'renderCart');
}"""

replacement = """function runInitializers() {
    const safeRun = (fn, name) => {
        try {
            if (typeof fn === 'function') fn();
        } catch (err) {
            console.warn(`Initializer "${name}" warning:`, err);
        }
    };
    safeRun(() => ensureModalsInDOM(), 'ensureModalsInDOM');
    safeRun(() => initLanguage(), 'initLanguage');
    safeRun(() => initUI(), 'initUI');
    safeRun(() => initStickyHeader(), 'initStickyHeader');
    safeRun(() => initUniversalSearch(), 'initUniversalSearch');
    safeRun(() => initHeroSlider(), 'initHeroSlider');
    safeRun(() => initScrollReveal(), 'initScrollReveal');
    safeRun(() => initScrollToTop(), 'initScrollToTop');
    safeRun(() => initMobileNav(), 'initMobileNav');
    safeRun(() => initFaqSearch(), 'initFaqSearch');
    safeRun(() => initProductsSort(), 'initProductsSort');
    safeRun(() => initReviewsData(), 'initReviewsData');
    safeRun(() => syncProductsWithStorage(), 'syncProductsWithStorage');
    safeRun(() => initCustomerRatingsMarquee(), 'initCustomerRatingsMarquee');
    safeRun(() => initSatvikStoryVideoPlayer(), 'initSatvikStoryVideoPlayer');
    safeRun(() => initContactForm(), 'initContactForm');
    safeRun(() => initProductDetailsPage(), 'initProductDetailsPage');
    safeRun(() => initProfilePage(), 'initProfilePage');
    safeRun(() => initReorderSection(), 'initReorderSection');
    safeRun(() => initFloatingAgent(), 'initFloatingAgent');
    safeRun(() => initFooterAccordion(), 'initFooterAccordion');
    safeRun(() => renderCart(), 'renderCart');
}"""

js_norm = js.replace('\r\n', '\n')
t_norm = target.replace('\r\n', '\n')
r_norm = replacement.replace('\r\n', '\n')

if t_norm in js_norm:
    js_norm = js_norm.replace(t_norm, r_norm, 1)
    with open('public/site/script.js', 'w', encoding='utf-8') as f:
        f.write(js_norm)
    print('Updated runInitializers successfully!')
else:
    print('Target not found in script.js!')
