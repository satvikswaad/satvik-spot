code = '''

// ═════════════════════════════════════════════════════════════════════════════
// CUSTOMER REVIEWS & HOMEPAGE CURATION MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

let currentReviewsFilter = 'all';
let currentReviewsQuery = '';

function renderReviewsManagement() {
    const listContainer = document.getElementById('reviews-list-container');
    if (!listContainer) return;

    const allReviews = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getReviews === 'function')
        ? adminDataAdapter.getReviews()
        : (adminState.reviews || []);

    const featuredReviews = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getFeaturedReviews === 'function')
        ? adminDataAdapter.getFeaturedReviews()
        : allReviews.filter(r => r.featured === true);

    const featuredIds = new Set(featuredReviews.map(r => r.id));

    // Update KPI stats
    const statTotal = document.getElementById('stat-total-reviews');
    if (statTotal) statTotal.textContent = allReviews.length;

    const statFeatured = document.getElementById('stat-featured-reviews');
    if (statFeatured) statFeatured.textContent = featuredIds.size;

    const navBadge = document.getElementById('badge-featured-reviews');
    if (navBadge) navBadge.textContent = featuredIds.size;

    const fiveStars = allReviews.filter(r => Number(r.rating) === 5);
    const stat5Star = document.getElementById('stat-5star-reviews');
    if (stat5Star) stat5Star.textContent = fiveStars.length;

    const statAvg = document.getElementById('stat-avg-rating');
    if (statAvg) {
        if (allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
            statAvg.textContent = (sum / allReviews.length).toFixed(1) + ' ★';
        } else {
            statAvg.textContent = '5.0 ★';
        }
    }

    // Filter
    let filtered = allReviews.filter(r => {
        const isFeat = featuredIds.has(r.id) || r.featured === true;
        if (currentReviewsFilter === 'featured' && !isFeat) return false;
        if (currentReviewsFilter === '5star' && Number(r.rating) !== 5) return false;
        if (currentReviewsFilter === 'unfeatured' && isFeat) return false;

        if (currentReviewsQuery) {
            const q = currentReviewsQuery.toLowerCase();
            const author = (r.customerName || r.author || '').toLowerCase();
            const city = (r.city || '').toLowerCase();
            const prod = (r.productName || '').toLowerCase();
            const title = (r.title || '').toLowerCase();
            const text = (r.text || r.comment || '').toLowerCase();
            if (!author.includes(q) && !city.includes(q) && !prod.includes(q) && !title.includes(q) && !text.includes(q)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1/-1; padding: 36px 20px; text-align: center; background: #FFFFFF; border-radius: 12px; border: 1px dashed #D4A017;">
                <p style="font-size: 1.1rem; color: #7A1C1C; font-weight: 700; margin-bottom: 6px;">No reviews found matching filter.</p>
                <p style="font-size: 0.85rem; color: #6B625B;">Try choosing 'All Reviews' or clearing the search query.</p>
            </div>
        `;
        return;
    }

    const frag = document.createDocumentFragment();

    filtered.forEach(r => {
        const isFeat = featuredIds.has(r.id) || r.featured === true;
        const card = document.createElement('article');
        card.className = 'rev-admin-card';
        card.style.cssText = `
            background: #FFFFFF;
            border: 1.5px solid ${isFeat ? 'var(--gold, #D4A017)' : 'var(--border, #E8DFD3)'};
            border-radius: 14px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: ${isFeat ? '0 4px 14px rgba(212, 160, 23, 0.14)' : '0 2px 6px rgba(0,0,0,0.03)'};
            transition: all 0.2s ease;
        `;

        const stars = '★'.repeat(Math.min(5, Math.max(1, Number(r.rating) || 5)));
        const initials = (r.customerName || r.author || 'SS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        card.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${isFeat ? '#FAF5EB' : '#F4EFE6'}; color: #7A1C1C; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; border: 1.5px solid ${isFeat ? '#D4A017' : '#D4C7B5'};">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 0.92rem; color: #2A211D;">${r.customerName || r.author || 'Anonymous'}</div>
                            <div style="font-size: 0.74rem; color: #6B625B;">📍 ${r.city || 'India'} ${r.verified ? '• <span style="color:#2C5E3B;font-weight:700;">✓ Verified</span>' : ''}</div>
                        </div>
                    </div>
                    <span style="color: #D4A017; font-size: 1.15rem; letter-spacing: 1px;">${stars}</span>
                </div>

                <div style="margin-bottom: 10px;">
                    <span style="display: inline-block; background: #FAF5EB; color: #7A1C1C; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(212,160,23,0.3);">
                        🏷️ ${r.productName || 'Artisanal Delicacy'}
                    </span>
                    ${r.date ? `<span style="font-size: 0.72rem; color: #8C827A; margin-left: 6px;">${r.date}</span>` : ''}
                </div>

                ${r.title ? `<div style="font-weight: 700; font-size: 0.95rem; color: #7A1C1C; margin-bottom: 4px;">"${r.title}"</div>` : ''}
                <p style="font-size: 0.86rem; color: #4A3E39; line-height: 1.5; margin-bottom: 16px; font-style: italic;">
                    "${r.text || r.comment || ''}"
                </p>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #F4EFE6; padding-top: 12px; margin-top: auto;">
                <button type="button" class="rev-toggle-btn ${isFeat ? 'active' : ''}" data-review-id="${r.id}" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: ${isFeat ? 'linear-gradient(135deg, #FAF5EB, #FFF8E7)' : '#F4EFE6'};
                    color: ${isFeat ? '#856404' : '#6B625B'};
                    border: 1.5px solid ${isFeat ? '#D4A017' : '#D4C7B5'};
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.78rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <span>${isFeat ? '⭐ Live on Homepage' : 'Hidden from Homepage'}</span>
                </button>

                <button type="button" class="btn-delete-review" data-review-id="${r.id}" aria-label="Delete Review" style="background: none; border: none; color: #C0392B; cursor: pointer; font-size: 0.82rem; padding: 4px 6px;">
                    🗑️
                </button>
            </div>
        `;

        frag.appendChild(card);
    });

    listContainer.replaceChildren(frag);

    // Bind toggles
    listContainer.querySelectorAll('.rev-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const revId = btn.getAttribute('data-review-id');
            if (revId && typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.toggleFeaturedReview === 'function') {
                const res = adminDataAdapter.toggleFeaturedReview(revId);
                showAdminToast(`⭐ Review ${res.featured ? 'added to' : 'removed from'} Homepage marquee!`, 'success');
                renderReviewsManagement();
            }
        });
    });

    // Bind deletes
    listContainer.querySelectorAll('.btn-delete-review').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const revId = btn.getAttribute('data-review-id');
            if (revId && confirm('Delete this review permanently?')) {
                adminDataAdapter.deleteReview(revId);
                showAdminToast('Review deleted', 'info');
                renderReviewsManagement();
            }
        });
    });
}

function initReviewsManagementEvents() {
    // Publish button
    const btnPublish = document.getElementById('btn-publish-reviews');
    if (btnPublish) {
        btnPublish.addEventListener('click', () => {
            if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.publishFeaturedReviews === 'function') {
                const list = adminDataAdapter.publishFeaturedReviews();
                showAdminToast(`🚀 Published ${list.length} curated reviews to Homepage!`, 'success');
            } else {
                showAdminToast('🚀 Reviews saved!', 'success');
            }
        });
    }

    // Filter tabs
    const tabs = document.querySelectorAll('#reviews-filter-tabs .filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentReviewsFilter = tab.getAttribute('data-filter') || 'all';
            renderReviewsManagement();
        });
    });

    // Search input
    const searchInput = document.getElementById('input-search-reviews');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentReviewsQuery = (e.target.value || '').trim();
            renderReviewsManagement();
        });
    }

    // Add review modal
    const btnOpenModal = document.getElementById('btn-open-add-review-modal');
    const modal = document.getElementById('modal-add-review');
    const btnCloseModal = document.getElementById('btn-close-modal-review');
    const formAdd = document.getElementById('form-add-review');

    if (btnOpenModal && modal) {
        btnOpenModal.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    if (btnCloseModal && modal) {
        btnCloseModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    if (formAdd && modal) {
        formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('review-customer-name')?.value;
            const city = document.getElementById('review-city')?.value;
            const prod = document.getElementById('review-product-name')?.value;
            const rating = Number(document.getElementById('review-rating')?.value || 5);
            const title = document.getElementById('review-title')?.value;
            const text = document.getElementById('review-text')?.value;
            const featured = document.getElementById('review-featured')?.checked !== false;

            if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.addReview === 'function') {
                adminDataAdapter.addReview({
                    customerName: name,
                    author: name,
                    city: city || 'India',
                    productName: prod,
                    rating: rating,
                    title: title,
                    text: text,
                    featured: featured,
                    verified: true
                });
                showAdminToast('✅ New testimonial added successfully!', 'success');
                formAdd.reset();
                modal.classList.remove('active');
                renderReviewsManagement();
            }
        });
    }
}

// Subscribe to reviews updates
if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.subscribe === 'function') {
    adminDataAdapter.subscribe('reviews', () => {
        if (typeof adminState !== 'undefined' && adminState.activeView === 'view-reviews') {
            renderReviewsManagement();
        }
    });
}

// Auto-run initReviewsManagementEvents when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewsManagementEvents);
} else {
    initReviewsManagementEvents();
}
'''

with open('public/admin/admin.js', 'r', encoding='utf-8') as f:
    orig = f.read()

if 'function renderReviewsManagement' not in orig:
    with open('public/admin/admin.js', 'w', encoding='utf-8') as f:
        f.write(orig + code)
    print('admin.js updated with renderReviewsManagement!')
else:
    print('Already present in admin.js')
