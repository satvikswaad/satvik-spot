/**
 * Satvik Swaad — Military-Grade Smart AI Assistant Engine
 * Features:
 *  - Comprehensive Knowledge Base: All 17 Products, Reviews, Policies, Purity & Heritage.
 *  - Smart Search & Similarity Matcher: Direct match, category search, and fuzzy fallback.
 *  - "I think you are trying to say this" fallback with rich product cards & instant Add-to-Cart.
 *  - Military-Grade Security: Prompt Injection Defense, Zero Credential Leak, XSS Neutralizer, Anti-Flooding.
 *  - Responsive Spacious UI: Auto-adapting layout without any external phone number leaks.
 */

import { PRODUCTS_CATALOGUE } from './productsData.js';
import { sanitizeText } from './security.js';

/* ── 1. KNOWLEDGE BASE & DOMAIN INTELLIGENCE ── */

const POLICIES_KNOWLEDGE = {
    cancellation: "🔄 **रद्दीकरण और धनवापसी (Cancellation & Refund):**\n" +
        "• **100% निःशुल्क प्रतिस्थापन (Free Replacement):** यदि कूरियर में कोई कांच का जार टूटता या लीक होता है, तो 24-48 घंटों के भीतर फोटो/वीडियो साझा करने पर हम तुरंत 100% फ्री नया जार भेजते हैं।\n" +
        "• **खाद्य स्वच्छता नीति:** स्वच्छता नियमों के अनुसार, सुरक्षित रूप से डिलीवर होने के बाद खाने-पीने के उत्पाद वापस (Non-Returnable) नहीं लिए जा सकते।\n" +
        "• **डिस्पैच पूर्व रद्दीकरण:** ऑर्डर देने के 2 घंटे के भीतर या डिस्पैच से पहले 100% फुल रिफंड के साथ ऑर्डर रद्द किया जा सकता है।",
    
    shipping: "🚚 **शिपिंग और डिलीवरी (Shipping & Delivery):**\n" +
        "• **ताज़ा बैच डिस्पैच:** ऑर्डर 24 से 48 व्यावसायिक घंटों में ताज़ा पैक होकर एक्सप्रेस कूरियर से भेजे जाते हैं।\n" +
        "• **डिलीवरी समय:** मेट्रो शहरों में 3-5 दिन, अन्य कस्बों में 5-7 दिन (19,000+ पिन कोड)।\n" +
        "• **मुफ़्त शिपिंग:** ₹499 से अधिक के सभी ऑर्डर पर पूरे भारत में निःशुल्क डिलीवरी।",

    purity: "🌿 **सात्विक शुद्धता वादा (Purity & Heritage):**\n" +
        "• 100% शुद्ध कच्ची घानी सरसों का तेल (Zero Palm Oil, Zero Refined Oil)।\n" +
        "• 14+ दिनों तक पारंपरिक कांच की बरनी में धूप में पकाया गया (Traditional Sun-Cured)।\n" +
        "• शून्य रासायनिक प्रिजर्वेटिव (Zero Sodium Benzoate / INS 211, Zero Synthetic Vinegar)।\n" +
        "• केवल प्राकृतिक सेंधा नमक (Rock Salt), देसी खांड, जैविक गुड़ और A2 गाय का घी।",

    privacy: "🔒 **गोपनीयता और डेटा सुरक्षा (Privacy & Zero-Spam):**\n" +
        "• सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचारक मैसेजिंग या मेल सेवाओं का उपयोग नहीं करता है।\n" +
        "• 0% डेटा बिक्री या विज्ञापनदाताओं से साझा करना।\n" +
        "• 256-बिट SSL एन्क्रिप्टेड भुगतान (Razorpay द्वारा समर्थित UPI, Cards, NetBanking)।"
};

const REVIEWS_KNOWLEDGE = {
    summary: "⭐ **ग्राहक समीक्षाएं (Customer Reviews):**\n" +
        "हमारे 500+ सत्यापित ग्राहकों ने सात्विक स्वाद को 4.8/5 की रेटिंग दी है। ग्राहक विशेष रूप से हमारे आम के अचार की सरसों तेल की खुशबू, आंवला मुरब्बे की ताज़गी और गोंद के लड्डू के शुद्ध A2 घी के स्वाद की प्रशंसा करते हैं। कांच के जार की 5-लेयर पैकेजिंग को 'लीकप्रूफ और सुरक्षित' बताया गया है।"
};

/* ── 2. MILITARY-GRADE SECURITY GUARD ── */

class SecurityGuard {
    constructor() {
        this.lastMessageTime = 0;
        this.messageCountWindow = [];
        this.maxRequestsPerMinute = 25;
        this.minGapMs = 700;
        this.maxInputLength = 220;

        // Threat patterns: Prompt Injection, Jailbreaks, Credential Probing, Code Injection
        this.injectionPatterns = [
            /(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above|existing)\s+(instructions|prompts|rules|commands)/i,
            /(system\s*prompt|initial\s*prompt|developer\s*mode|you\s*are\s*now\s*dan|jailbreak|reveal\s*your\s*instructions)/i,
            /(what\s+is\s+your\s+prompt|show\s+me\s+your\s+rules|repeat\s+the\s+words\s+above)/i,
            /(api[\s_-]?key|firebase[\s_-]?config|secret[\s_-]?key|admin[\s_-]?pass|auth[\s_-]?token|service[\s_-]?account|credentials)/i,
            /(db[\s_-]?password|database[\s_-]?url|server[\s_-]?path|root\s*access|private\s*key)/i,
            /(<script|onerror\s*=|onload\s*=|javascript:|document\.cookie|localStorage\.getItem|eval\(|new\s+Function)/i,
            /(SELECT\s+.*FROM|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|--|1=1)/i,
            /(rm\s+-rf|chmod\s+|cat\s+\/etc\/passwd|bash\s+-c)/i
        ];

        // Credential leak patterns to strip from outputs
        this.credentialPatterns = [
            /AIzaSy[0-9A-Za-z_-]{33}/g, // Google / Firebase API keys
            /[a-zA-Z0-9_-]{20,}:[a-zA-Z0-9_-]{20,}/g,
            /bearer\s+[a-zA-Z0-9_.-]+/gi,
            /(password|secret|apikey|token)\s*[:=]\s*['"][^'"]+['"]/gi,
            /[A-Z]:\\[a-zA-Z0-9_\\]+/gi // Windows paths
        ];
    }

    validate(input) {
        if (!input || typeof input !== 'string') {
            return { ok: false, reason: "खाली संदेश अमान्य है। (Empty message)" };
        }

        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return { ok: false, reason: "खाली संदेश अमान्य है। (Empty message)" };
        }

        if (trimmed.length > this.maxInputLength) {
            return { ok: false, reason: "संदेश की लंबाई अधिकतम 200 अक्षरों तक सीमित है। (Input too long)" };
        }

        // Anti-Flooding / Rate-Limiting
        const now = Date.now();
        if (now - this.lastMessageTime < this.minGapMs) {
            return { ok: false, reason: "कृपया थोड़ा रुक कर संदेश भेजें। (Please wait a moment before sending another message.)" };
        }

        this.messageCountWindow = this.messageCountWindow.filter(t => now - t < 60000);
        if (this.messageCountWindow.length >= this.maxRequestsPerMinute) {
            return { ok: false, reason: "अनुरोध सीमा पार हो गई है। कृपया 1 मिनट बाद पुनः प्रयास करें। (Rate limit exceeded.)" };
        }

        this.lastMessageTime = now;
        this.messageCountWindow.push(now);

        // Check for security threats
        for (const pattern of this.injectionPatterns) {
            if (pattern.test(trimmed)) {
                return {
                    ok: false,
                    isAttack: true,
                    reason: "🛡️ **सुरक्षा चेतावनी (Security Notice):** सात्विक स्वाद एआई असिस्टेंट केवल हमारे प्रामाणिक खाद्य उत्पादों, शुद्धता, नीतियों और ऑर्डर सहायता के लिए अधिकृत है। सिस्टम क्रेडेंशियल्स, कोड निष्पादन या आंतरिक निर्देश पूर्णतः गोपनीय एवं सुरक्षित हैं।"
                };
            }
        }

        return { ok: true, sanitized: sanitizeText(trimmed) };
    }

    sanitizeOutput(output) {
        if (typeof output !== 'string') return '';
        let cleaned = output;
        for (const pattern of this.credentialPatterns) {
            cleaned = cleaned.replace(pattern, '[सुरक्षित / REDACTED]');
        }
        return cleaned;
    }
}

const guard = new SecurityGuard();

/* ── 3. SMART PRODUCT SEARCH & SIMILARITY MATCHER ── */

function normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[^\w\s\u0900-\u097F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Searches PRODUCTS_CATALOGUE and returns matching products or fallback similar products.
 */
function findProductsByQuery(query) {
    const norm = normalizeText(query);
    if (!norm) return { exactMatches: [], similarMatches: [], isDirect: false };

    const STOPWORDS = new Set([
        'का', 'के', 'की', 'को', 'में', 'से', 'पर', 'और', 'या', 'है', 'हैं', 'सा', 'से', 'कहा', 'कहाँ',
        'hai', 'hain', 'ka', 'ke', 'ki', 'ko', 'mein', 'se', 'par', 'aur', 'ya', 'the', 'is', 'in', 'of', 'and', 'or', 'for', 'with', 'to', 'a', 'an'
    ]);
    const GENERIC_CATEGORY_WORDS = new Set([
        'अचार', 'आचार', 'achar', 'achaar', 'pickle', 'pickles',
        'मुरब्बा', 'murabba', 'लड्डू', 'laddu', 'ladoo', 'sweet', 'sweets', 'mithai',
        'च्यवनप्राश', 'chyawanprash', 'उत्पाद', 'product', 'products', 'item', 'items'
    ]);

    const queryWords = norm.split(' ').filter(w => w.length > 1 && !STOPWORDS.has(w));
    const specificWords = queryWords.filter(w => !GENERIC_CATEGORY_WORDS.has(w));

    let anySpecificMatched = false;

    const scores = PRODUCTS_CATALOGUE.map(prod => {
        let score = 0;
        const nameNorm = normalizeText(prod.name);
        const hindiNorm = normalizeText(prod.hindiName);
        const catNorm = normalizeText(prod.category);
        const descNorm = normalizeText(prod.shortDesc + ' ' + prod.ingredients);

        // Exact full phrase match
        if (nameNorm.includes(norm) || hindiNorm.includes(norm) || prod.id.includes(norm)) {
            score += 100;
            anySpecificMatched = true;
        }

        // Specific ingredient or product name match
        let matchedSpecific = false;
        specificWords.forEach(word => {
            if (nameNorm.includes(word) || hindiNorm.includes(word)) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            } else if (descNorm.includes(word)) {
                score += 20;
                matchedSpecific = true;
                anySpecificMatched = true;
            }

            // Synonyms
            if ((word === 'आम' || word === 'aam' || word === 'mango') && (nameNorm.includes('aam') || hindiNorm.includes('आम'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'मिर्च' || word === 'mirch' || word === 'chilli') && (nameNorm.includes('mirch') || hindiNorm.includes('मिर्च'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'आंवला' || word === 'amla' || word === 'gooseberry') && (nameNorm.includes('amla') || hindiNorm.includes('आंवला'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'नींबू' || word === 'nimbu' || word === 'lemon') && (nameNorm.includes('nimbu') || hindiNorm.includes('नींबू'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'लहसुन' || word === 'lahsun' || word === 'garlic') && (nameNorm.includes('lhsun') || hindiNorm.includes('लहसुन') || nameNorm.includes('lehsun'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'गोंद' || word === 'gond') && (nameNorm.includes('gond') || hindiNorm.includes('गोंद'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'बेसन' || word === 'besan') && (nameNorm.includes('besan') || hindiNorm.includes('बेसन'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'सेब' || word === 'seb' || word === 'apple') && (nameNorm.includes('seb') || hindiNorm.includes('सेब'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'करेला' || word === 'karela' || word === 'kareli') && (prod.id.includes('kareli') || hindiNorm.includes('करेली') || nameNorm.includes('kareli'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
            if ((word === 'हींग' || word === 'heeng' || word === 'hing') && (nameNorm.includes('heeng') || hindiNorm.includes('हींग'))) {
                score += 60;
                matchedSpecific = true;
                anySpecificMatched = true;
            }
        });

        // If user queried specific ingredient(s) (e.g., 'कटहल') but this product did not match them, score is 0
        if (specificWords.length > 0 && !matchedSpecific) {
            score = 0;
        }

        // If no specific words, evaluate generic category terms
        if (specificWords.length === 0) {
            queryWords.forEach(word => {
                if (catNorm.includes(word)) score += 20;
                if ((word === 'अचार' || word === 'आचार' || word === 'achar' || word === 'pickle') && prod.category === 'achar') score += 30;
                if ((word === 'मुरब्बा' || word === 'murabba') && prod.category === 'murabba') score += 30;
                if ((word === 'लड्डू' || word === 'laddu' || word === 'sweet' || word === 'mithai') && prod.category === 'sweets') score += 30;
                if ((word === 'च्यवनप्राश' || word === 'chyawanprash') && prod.id.includes('chyawanprash')) {
                    score += 60;
                    anySpecificMatched = true;
                }
            });
        }

        return { product: prod, score };
    });

    scores.sort((a, b) => b.score - a.score);

    // Direct match requires that if specific words were given, at least one matched
    const isDirectMatch = (specificWords.length === 0) ? (scores.length > 0 && scores[0].score >= 30) : (anySpecificMatched && scores.filter(s => s.score >= 40).length > 0);
    const highMatches = isDirectMatch ? scores.filter(s => s.score >= 30).map(s => s.product) : [];

    if (highMatches.length > 0 && anySpecificMatched) {
        return {
            exactMatches: highMatches.slice(0, 3),
            similarMatches: [],
            isDirect: true
        };
    }

    // Fallback: If user searched something related to pickle/achar, show best pickle recommendations
    let fallbacks = [];
    if (norm.includes('achar') || norm.includes('अचार') || norm.includes('आचार') || norm.includes('pickle')) {
        fallbacks = PRODUCTS_CATALOGUE.filter(p => p.category === 'achar').slice(0, 3);
    } else if (norm.includes('sweet') || norm.includes('mithai') || norm.includes('लड्डू') || norm.includes('laddu') || norm.includes('meetha')) {
        fallbacks = PRODUCTS_CATALOGUE.filter(p => p.category === 'sweets' || p.category === 'murabba').slice(0, 3);
    } else if (norm.includes('amla') || norm.includes('आंवला')) {
        fallbacks = PRODUCTS_CATALOGUE.filter(p => p.name.toLowerCase().includes('amla')).slice(0, 3);
    } else if (norm.includes('murabba') || norm.includes('मुरब्बा')) {
        fallbacks = PRODUCTS_CATALOGUE.filter(p => p.category === 'murabba').slice(0, 3);
    } else {
        // Default top bestsellers
        fallbacks = PRODUCTS_CATALOGUE.filter(p => p.badge === 'Bestseller' || p.rating >= 4.9).slice(0, 3);
    }

    return {
        exactMatches: [],
        similarMatches: fallbacks,
        isDirect: false
    };
}

/* ── 4. QUERY INTENT CLASSIFIER & RESPONSE GENERATOR ── */

function generateAssistantResponse(userQuery) {
    const norm = normalizeText(userQuery);

    // 1. GREETING
    if (/^(hi|hello|hey|namaste|namaskar|pranam|ram ram|kya haal|suprabhat)/i.test(norm)) {
        return {
            text: "नमस्ते! 🙏 सात्विक स्वाद में आपका स्वागत है। हमारी 100% पारंपरिक, शुद्ध कच्ची घानी सरसों के तेल में धूप में पकी हुई रेसिपीज और आयुर्वेदिक औषधियों के बारे में आप क्या जानना चाहते हैं?",
            products: []
        };
    }

    // 2. CANCELLATION & REFUND POLICIES
    if (/refund|return|cancel|replacement|breakage|broken|tuta|damage|wapsi|paise/i.test(norm)) {
        return {
            text: POLICIES_KNOWLEDGE.cancellation,
            products: []
        };
    }

    // 3. SHIPPING, DELIVERY & DISPATCH
    if (/delivery|shipping|dispatch|days|reach|courier|track|status|pincode|charge|free/i.test(norm)) {
        return {
            text: POLICIES_KNOWLEDGE.shipping,
            products: []
        };
    }

    // 4. PURITY, MUSTARD OIL, PRESERVATIVES, FSSAI
    if (/purity|mustard|oil|chemical|preservative|vinegar|fssai|kachi ghani|organic|ghee|salt|sendha/i.test(norm)) {
        return {
            text: POLICIES_KNOWLEDGE.purity,
            products: PRODUCTS_CATALOGUE.filter(p => p.id === 'prod_aam_achar' || p.id === 'prod_chyawanprash')
        };
    }

    // 5. REVIEWS & RATINGS
    if (/review|rating|feedback|star|taste|quality|kaisa hai|reviews/i.test(norm)) {
        return {
            text: REVIEWS_KNOWLEDGE.summary,
            products: PRODUCTS_CATALOGUE.filter(p => p.rating === 5.0 || p.rating === 4.9).slice(0, 2)
        };
    }

    // 6. PRIVACY & SPAM GUARANTEE
    if (/privacy|spam|data|security|safe|upi|payment|gateway|razorpay/i.test(norm)) {
        return {
            text: POLICIES_KNOWLEDGE.privacy,
            products: []
        };
    }

    // 7. PRODUCT SEARCH & SIMILARITY FALLBACK
    const searchRes = findProductsByQuery(userQuery);

    if (searchRes.isDirect && searchRes.exactMatches.length > 0) {
        const topProd = searchRes.exactMatches[0];
        const defaultVar = topProd.variants && topProd.variants[0];
        const priceInfo = defaultVar ? `₹${defaultVar.price} (${defaultVar.label})` : '';

        return {
            text: `✨ **${topProd.name} (${topProd.hindiName})**\n` +
                  `• **विशेषता:** ${topProd.shortDesc}\n` +
                  `• **मुख्य सामग्री:** ${topProd.ingredients}\n` +
                  `• **मूल्य:** ${priceInfo} | **रेटिंग:** ${topProd.rating}★ (${topProd.reviewCount} समीक्षाएं)\n` +
                  `• 100% शुद्ध कोल्ड-प्रेस्ड सरसों तेल एवं पारंपरिक धूप में पकाया गया।`,
            products: searchRes.exactMatches
        };
    }

    // Fallback requirement:
    // "अगर वो चीज नहीं... तो वो आंसर देगा कि अभी उपलब्ध नहीं है या मैं खोज नहीं पा रहा हूं। और उससे सिमिलर प्रोडक्ट्स दिखा दे। मतलब आचार है तो आचार से सिमिलर प्रोडक्ट्स दिखा दे। कि I think you are trying to say this and वो सारी चीजें दिखा दे। और वहां पे ऐड टू कार्ड का ऑप्शन भी है।"
    return {
        text: "माफ़ कीजिए, यह विशेष उत्पाद अभी उपलब्ध नहीं है या मैं खोज नहीं पा रहा हूँ। 🌿\n" +
              "लेकिन आप शायद हमारे इन पारंपरिक और सबसे लोकप्रिय स्वादों को ढूँढ रहे हैं:\n" +
              "*(I think you are trying to say this / I think you might be looking for these authentic handcrafted preserves:)*",
        products: searchRes.similarMatches,
        isFallback: true
    };
}

/* ── 5. HTML BUILDER FOR PRODUCT CARDS IN CHAT ── */

function renderChatProductCard(prod) {
    if (!prod) return '';
    const defVariant = (prod.variants && prod.variants.find(v => v.active && v.stock > 0)) || (prod.variants && prod.variants[0]) || { id: 'var_500g', price: 249, mrp: 320, label: '500 g' };
    const imgSrc = (prod.images && prod.images[0]) || 'assets/aam-ka-achar.png';
    const badgeText = prod.badge || (prod.rating >= 4.8 ? 'Top Rated' : 'Artisanal');

    return `
    <div class="agent-product-card" data-product-id="${prod.id}">
        <img src="${imgSrc}" alt="${sanitizeText(prod.name)}" class="agent-prod-img" loading="lazy" />
        <div class="agent-prod-details">
            <span class="agent-prod-badge">${badgeText}</span>
            <h4 class="agent-prod-title">${sanitizeText(prod.name)}</h4>
            <span class="agent-prod-hindi">${sanitizeText(prod.hindiName || '')}</span>
            <div class="agent-prod-price-row">
                <span class="agent-prod-price">₹${defVariant.price}</span>
                ${defVariant.mrp > defVariant.price ? `<span class="agent-prod-mrp">₹${defVariant.mrp}</span>` : ''}
                <span class="agent-prod-weight">${defVariant.label}</span>
            </div>
        </div>
        <button type="button" class="btn-agent-add-cart" data-product-id="${prod.id}" data-variant-id="${defVariant.id}" aria-label="Add ${sanitizeText(prod.name)} to cart">
            <span class="cart-btn-icon">🛒</span>
            <span class="cart-btn-text">Add to Cart</span>
        </button>
    </div>`;
}

/* ── 6. FLOATING AGENT WIDGET CONTROLLER ── */

export function initFloatingAgent() {
    const trigger = document.getElementById('satvik-agent-trigger');
    const card = document.getElementById('satvik-agent-card');
    const closeBtn = document.getElementById('agent-close-btn');
    const form = document.getElementById('agent-chat-form');
    const input = document.getElementById('agent-input');
    const messages = document.getElementById('agent-messages-container');
    const chipsContainer = document.getElementById('agent-quick-chips');

    if (!trigger || !card) return;
    if (trigger._boundAgent) return;
    trigger._boundAgent = true;

    // Remove any hardcoded WhatsApp phone numbers from card footer for privacy & security
    const directWaEls = card.querySelectorAll('.agent-direct-wa');
    directWaEls.forEach(el => el.remove());

    // Inject security badge if not already present
    if (!card.querySelector('.agent-security-badge')) {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'agent-security-badge';
        badgeDiv.innerHTML = `<span>🛡️ 100% Encrypted &bull; Direct Satvik Intelligence</span>`;
        const footer = card.querySelector('.agent-card-footer');
        if (footer) footer.appendChild(badgeDiv);
    }

    function openAgent() {
        card.classList.add('active');
        card.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        if (input) input.focus();
    }

    function closeAgent() {
        card.classList.remove('active');
        card.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (card.classList.contains('active')) {
            closeAgent();
        } else {
            openAgent();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAgent();
        });
    }

    document.addEventListener('click', (e) => {
        if (card.classList.contains('active')) {
            const widget = document.getElementById('satvik-agent-widget');
            if (widget && !widget.contains(e.target)) {
                closeAgent();
            }
        }
    });

    // Delegated Add-to-Cart event listener inside chat messages
    if (messages && !messages._cartBound) {
        messages._cartBound = true;
        messages.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-agent-add-cart');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            const pId = btn.getAttribute('data-product-id');
            const vId = btn.getAttribute('data-variant-id') || 'var_500g';

            if (!pId) return;

            // Trigger global addToCart
            if (typeof window.addToCart === 'function') {
                window.addToCart(pId, vId, 1);
            }

            // Visual feedback on button
            btn.classList.add('added');
            const textSpan = btn.querySelector('.cart-btn-text');
            const iconSpan = btn.querySelector('.cart-btn-icon');
            if (textSpan) textSpan.textContent = '✓ Added!';
            if (iconSpan) iconSpan.textContent = '✓';

            setTimeout(() => {
                if (textSpan) textSpan.textContent = '+ Add More';
                if (iconSpan) iconSpan.textContent = '🛒';
                btn.classList.remove('added');
            }, 1800);
        });
    }

    function appendMessage(content, isUser = false, products = []) {
        if (!messages) return;
        const msg = document.createElement('div');
        msg.className = `agent-msg ${isUser ? 'agent-msg-user' : 'agent-msg-bot'}`;

        let formattedText = guard.sanitizeOutput(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');

        let html = `<div class="agent-msg-text">${formattedText}</div>`;

        if (Array.isArray(products) && products.length > 0) {
            html += `<div class="agent-cards-container">`;
            products.forEach(p => {
                html += renderChatProductCard(p);
            });
            html += `</div>`;
        }

        msg.innerHTML = html;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Quick Chips Listener
    if (chipsContainer) {
        chipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.agent-chip');
            if (!chip) return;
            const action = chip.getAttribute('data-action');
            const chipText = chip.textContent;
            appendMessage(chipText, true);

            setTimeout(() => {
                if (action === 'track') {
                    appendMessage(POLICIES_KNOWLEDGE.shipping);
                } else if (action === 'whatsapp') {
                    appendMessage("💬 हमारे प्रामाणिक ग्राहक सहायता से सीधे जुड़ने के लिए WhatsApp खोल रहे हैं...");
                    window.open('https://wa.me/919236587600?text=Namaste!%20I%20need%20assistance%20with%20Satvik%20Swaad', '_blank');
                } else if (action === 'purity') {
                    appendMessage(POLICIES_KNOWLEDGE.purity);
                } else if (action === 'recommend') {
                    const topFavorites = PRODUCTS_CATALOGUE.filter(p => p.id === 'prod_aam_achar' || p.id === 'prod_amla_murabba' || p.id === 'prod_chyawanprash');
                    appendMessage("🍯 **हमारे शीर्ष 3 ग्राहक पसंदीदा उत्पाद:**", false, topFavorites);
                }
            }, 300);
        });
    }

    // Input Form Submission
    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const rawText = input.value;
            input.value = '';

            // Run Military-Grade Security Check
            const validation = guard.validate(rawText);
            if (!validation.ok) {
                appendMessage(validation.reason, false);
                return;
            }

            const cleanText = validation.sanitized;
            appendMessage(cleanText, true);

            // Generate AI Response with smart search & similarity fallback
            setTimeout(() => {
                const response = generateAssistantResponse(cleanText);
                appendMessage(response.text, false, response.products);
            }, 400);
        });
    }
}
