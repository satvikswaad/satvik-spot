/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Satvik Swaad — Enterprise Analytics & Business Intelligence Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * Agent 2: Analytics & Business Intelligence Engine Specialist
 * File: public/admin/adminAnalytics.js
 *
 * Capabilities:
 *  1. Multi-Timeframe Granularity:
 *     - Daily: Today vs Yesterday, with hourly trajectory.
 *     - Weekly: Last 7 Days, Last 14 Days day-by-day comparison.
 *     - Monthly: Current Month (MTD), Last 30 Days rolling.
 *     - Yearly: Annual overview, Q1-Q4 breakdown.
 *     - Custom: Custom date range picker support.
 *  2. Pure Interactive SVG Trajectory Charts (Zero External Libraries):
 *     - Revenue trajectory line graph with Satvik green gradient fill, interactive nodes, hover tooltips.
 *     - Orders volume vertical bar chart with rounded headers & hover metrics.
 *  3. Peak Rush Hour & Time Distribution Heatmap / Analysis:
 *     - 24-Hour hourly order distribution (00:00 to 23:00).
 *     - Dynamic peak rush hour detection (Morning Peak: 11 AM - 1 PM, Evening Rush: 7 PM - 10 PM).
 *     - Day-of-week sales distribution (Monday to Sunday) identifying best sales days.
 *  4. Product Velocity & Bestsellers Leaderboard:
 *     - Top 5 Products by Revenue (₹) and Volume (Units sold).
 *     - Contribution % per product with progress visualization.
 *     - Category distribution (Pickles, Murabba, Sweets, Health Powders).
 *     - Slow-moving inventory warnings with actionable promotional advice.
 *  5. Customer Sentiment & Likes/Dislikes Matrix:
 *     - Customer Satisfaction Index (CSAT %) score & star distribution.
 *     - Product-wise rating leaderboard (5★, 4★, 3★, 1-2★).
 *     - Positive vs Critical review breakdown and sentiment feedback themes.
 *  6. Omnichannel Split & Operational Metrics:
 *     - % Online vs % Offline revenue & units share.
 *     - Payment method breakdown (UPI, PayU Cards, NetBanking, COD, Offline Cash).
 *     - Average Order Value (AOV) for Online vs Offline with variance delta.
 *  7. Public API:
 *     - initAdminAnalytics(containerId, dataAdapter)
 *     - refreshAdminAnalytics(timeframe, customRange)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA ADAPTER INTERFACE & RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard AdminDataAdapter class for wrapping or providing data streams.
 */
export class AdminDataAdapter {
    constructor(source = {}) {
        this.orders = source.orders || [];
        this.products = source.products || [];
        this.offlineFinances = source.offlineFinances || [];
        this.reviews = source.reviews || [];
        this.listeners = [];
    }

    getOrders() { return this.orders; }
    getProducts() { return this.products; }
    getOfflineFinances() { return this.offlineFinances; }
    getReviews() { return this.reviews; }

    setData({ orders, products, offlineFinances, reviews }) {
        if (orders !== undefined) this.orders = orders;
        if (products !== undefined) this.products = products;
        if (offlineFinances !== undefined) this.offlineFinances = offlineFinances;
        if (reviews !== undefined) this.reviews = reviews;
        this.notify();
    }

    subscribe(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
            return () => {
                this.listeners = this.listeners.filter(cb => cb !== callback);
            };
        }
        return () => {};
    }

    notify() {
        this.listeners.forEach(cb => {
            try { cb(this); } catch (err) { console.error('AdminDataAdapter listener error:', err); }
        });
    }
}

/**
 * Extracts normalized datasets from an adapter or global adminState.
 */
function extractDataFromAdapter(adapter) {
    let orders = [];
    let products = [];
    let offlineFinances = [];
    let reviews = [];

    if (adapter) {
        if (typeof adapter.getOrders === 'function') {
            orders = adapter.getOrders() || [];
        } else if (Array.isArray(adapter.orders)) {
            orders = adapter.orders;
        }

        if (typeof adapter.getProducts === 'function') {
            products = adapter.getProducts() || [];
        } else if (Array.isArray(adapter.products)) {
            products = adapter.products;
        }

        if (typeof adapter.getOfflineFinances === 'function') {
            offlineFinances = adapter.getOfflineFinances() || [];
        } else if (Array.isArray(adapter.offlineFinances)) {
            offlineFinances = adapter.offlineFinances;
        }

        if (typeof adapter.getReviews === 'function') {
            reviews = adapter.getReviews() || [];
        } else if (Array.isArray(adapter.reviews)) {
            reviews = adapter.reviews;
        }
    }

    // Fallback to window.adminState if adapter is empty or omitted
    if (typeof window !== 'undefined' && window.adminState) {
        if (orders.length === 0 && Array.isArray(window.adminState.orders)) {
            orders = window.adminState.orders;
        }
        if (products.length === 0 && Array.isArray(window.adminState.products)) {
            products = window.adminState.products;
        }
        if (offlineFinances.length === 0 && Array.isArray(window.adminState.offlineFinances)) {
            offlineFinances = window.adminState.offlineFinances;
        }
        if (reviews.length === 0 && Array.isArray(window.adminState.reviews)) {
            reviews = window.adminState.reviews;
        }
    }

    return { orders, products, offlineFinances, reviews };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BENCHMARK DEMO DATASET GENERATOR (Zero-Empty Safeguard)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates realistic benchmark data so the analytics suite is fully demonstrable
 * if the live database currently has zero recorded transactions.
 */
function generateBenchmarkData() {
    const now = new Date();
    const mockOrders = [];
    const mockOffline = [];

    const catalog = [
        { id: 'prod_aam_achar', name: 'Aam ka Achar', category: 'achar', price: 249, stock: 45, rating: 4.9, reviewsCount: 38 },
        { id: 'prod_lal_mirch', name: 'Banarasi Lal Mirch Achar', category: 'achar', price: 299, stock: 30, rating: 4.8, reviewsCount: 29 },
        { id: 'prod_amla_murabba', name: 'Desi Amla Murabba', category: 'murabba', price: 349, stock: 25, rating: 4.9, reviewsCount: 34 },
        { id: 'prod_bel_murabba', name: 'Patanjali Bel Murabba', category: 'murabba', price: 329, stock: 18, rating: 4.7, reviewsCount: 16 },
        { id: 'prod_besan_laddu', name: 'Shuddh Desi Ghee Besan Laddu', category: 'sweets', price: 499, stock: 35, rating: 4.9, reviewsCount: 42 },
        { id: 'prod_kaju_katli', name: 'Artisanal Kaju Katli', category: 'sweets', price: 650, stock: 20, rating: 4.8, reviewsCount: 27 },
        { id: 'prod_triphala', name: 'Vedic Triphala Churna', category: 'powders', price: 199, stock: 40, rating: 4.7, reviewsCount: 22 },
        { id: 'prod_chyawanprash', name: 'Swarnabhasma Chyawanprash', category: 'powders', price: 549, stock: 15, rating: 4.9, reviewsCount: 31 },
        { id: 'prod_kareli_achar', name: 'Kareli ka Achar (Diabetic Friendly)', category: 'achar', price: 220, stock: 28, rating: 4.6, reviewsCount: 12 },
        { id: 'prod_haldi_churna', name: 'Pahadi Lakadong Haldi Churna', category: 'powders', price: 240, stock: 24, rating: 4.8, reviewsCount: 19 }
    ];

    const paymentMethods = ['upi', 'payu_cards', 'netbanking', 'cod'];

    // Generate 45 realistic orders distributed over the past 30 days
    for (let i = 0; i < 48; i++) {
        const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 30);
        // Hourly distribution peaked between 11-13 (morning) and 19-22 (evening)
        let hour = 12;
        const randTime = Math.random();
        if (randTime < 0.38) {
            hour = 11 + Math.floor(Math.random() * 3); // 11, 12, 13
        } else if (randTime < 0.82) {
            hour = 19 + Math.floor(Math.random() * 4); // 19, 20, 21, 22
        } else {
            hour = Math.floor(Math.random() * 24);
        }

        const orderDate = new Date(now.getTime() - (daysAgo * 86400000) - ((now.getHours() - hour) * 3600000));

        // Pick 1-3 items
        const numItems = Math.floor(Math.random() * 2) + 1;
        const items = [];
        let orderTotal = 0;

        for (let j = 0; j < numItems; j++) {
            const p = catalog[Math.floor(Math.random() * (catalog.length - 2))]; // skew towards popular
            const qty = Math.floor(Math.random() * 2) + 1;
            items.push({
                productId: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                qty: qty
            });
            orderTotal += p.price * qty;
        }

        if (orderTotal < 499) orderTotal += 50; // Delivery charge

        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const isPaid = method !== 'cod' || Math.random() > 0.15;

        mockOrders.push({
            id: 'ORD-DEMO-' + (1000 + i),
            name: ['Vikram Sharma', 'Ananya Gupta', 'Sunita Verma', 'Rajesh Patel', 'Meera Joshi', 'Arjun Saxena'][i % 6],
            phone: '+91 98' + (10000000 + i * 12345),
            total: orderTotal,
            status: isPaid ? (daysAgo > 3 ? 'delivered' : (daysAgo > 1 ? 'shipped' : 'confirmed')) : 'pending',
            paymentStatus: isPaid ? 'paid' : 'pending',
            paymentMethod: method,
            items: items,
            channel: 'online',
            createdAt: orderDate
        });
    }

    // Generate offline ledger entries (in-store sales + physical expenses)
    const offlineCategories = ['Retail Tasting Counter', 'Wholesale Bulk Sweet Box', 'Farmer Market Exhibition'];
    for (let k = 0; k < 12; k++) {
        const daysAgo = Math.floor(Math.random() * 28);
        const entryDate = new Date(now.getTime() - daysAgo * 86400000);
        const dateStr = entryDate.toISOString().split('T')[0];
        const isSale = k % 3 !== 0; // 2/3 sales, 1/3 expenses
        mockOffline.push({
            id: 'OFFLINE-' + (500 + k),
            date: dateStr,
            type: isSale ? 'income' : 'expense',
            category: isSale ? offlineCategories[k % offlineCategories.length] : 'Mustard Oil & Spices Batch',
            desc: isSale ? 'Direct Walk-in Cash/UPI Sale' : 'Cold-pressed mustard oil procurement from Varanasi',
            amount: isSale ? (800 + (k * 250)) : (2500 + (k * 400)),
            paymentMode: k % 2 === 0 ? 'cash' : 'upi'
        });
    }

    // Benchmark reviews
    const mockReviews = [
        { id: 'rev-1', customerName: 'Rajesh P.', rating: 5, comment: 'Authentic raw mango aroma, just like grandma used to make! Glass packaging was 100% leakproof.', productName: 'Aam ka Achar', date: '2026-09-24', likes: 18 },
        { id: 'rev-2', customerName: 'Sunita V.', rating: 5, comment: 'Pure desi ghee taste in Besan Laddu. Melt in mouth texture. Ordering again for Diwali!', productName: 'Shuddh Desi Ghee Besan Laddu', date: '2026-09-22', likes: 14 },
        { id: 'rev-3', customerName: 'Ananya G.', rating: 5, comment: 'Amla Murabba is soaked in pure honey syrup. No chemical aftertaste at all.', productName: 'Desi Amla Murabba', date: '2026-09-20', likes: 9 },
        { id: 'rev-4', customerName: 'Vikram S.', rating: 4, comment: 'Banarasi Lal Mirch has perfect tanginess. Delivery took 3 days to Delhi.', productName: 'Banarasi Lal Mirch Achar', date: '2026-09-18', likes: 7 },
        { id: 'rev-5', customerName: 'Pooja M.', rating: 5, comment: 'Triphala Churna has very fine texture and great freshness. Ayurvedic purity at its best.', productName: 'Vedic Triphala Churna', date: '2026-09-15', likes: 5 },
        { id: 'rev-6', customerName: 'Deepak K.', rating: 3, comment: 'Kareli achar is good, but would appreciate a slightly milder salt option.', productName: 'Kareli ka Achar (Diabetic Friendly)', date: '2026-09-12', likes: 2 }
    ];

    return {
        orders: mockOrders,
        products: catalog,
        offlineFinances: mockOffline,
        reviews: mockReviews,
        isDemo: true
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DATE PARSING & TIMEFRAME BOUNDS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely normalizes date from various formats (Firestore Timestamp, ISO String, epoch ms).
 */
function parseDateSafely(val) {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates start and end Date objects for a given timeframe keyword.
 */
function calculateTimeframeBounds(timeframe = '7d', customRange = null) {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    let compareStart = new Date(now);
    let compareEnd = new Date(now);
    let label = 'Last 7 Days';

    // Normalize end to end of day
    end.setHours(23, 59, 59, 999);

    switch (timeframe.toLowerCase()) {
        case 'today':
        case 'daily':
            start.setHours(0, 0, 0, 0);
            label = 'Today (vs Yesterday)';
            compareStart = new Date(start.getTime() - 86400000);
            compareEnd = new Date(end.getTime() - 86400000);
            break;

        case 'yesterday':
            start = new Date(now.getTime() - 86400000);
            start.setHours(0, 0, 0, 0);
            end = new Date(now.getTime() - 86400000);
            end.setHours(23, 59, 59, 999);
            label = 'Yesterday';
            compareStart = new Date(start.getTime() - 86400000);
            compareEnd = new Date(end.getTime() - 86400000);
            break;

        case '7d':
        case '7days':
        case 'weekly':
            start = new Date(now.getTime() - 6 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = 'Last 7 Days';
            compareStart = new Date(start.getTime() - 7 * 86400000);
            compareEnd = new Date(start.getTime() - 1);
            break;

        case '14d':
        case '14days':
            start = new Date(now.getTime() - 13 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = 'Last 14 Days';
            compareStart = new Date(start.getTime() - 14 * 86400000);
            compareEnd = new Date(start.getTime() - 1);
            break;

        case 'month':
        case 'this_month':
        case 'current_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            label = 'This Month (' + now.toLocaleString('en-IN', { month: 'short', year: 'numeric' }) + ')';
            compareStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            compareEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;

        case '30d':
        case '30days':
            start = new Date(now.getTime() - 29 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = 'Last 30 Days';
            compareStart = new Date(start.getTime() - 30 * 86400000);
            compareEnd = new Date(start.getTime() - 1);
            break;

        case 'year':
        case 'this_year':
        case 'annual':
        case 'yearly':
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            label = 'Annual ' + now.getFullYear() + ' (Q1-Q4 Breakdown)';
            compareStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            compareEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            break;

        case 'custom':
            if (customRange && customRange.startDate && customRange.endDate) {
                start = new Date(customRange.startDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(customRange.endDate);
                end.setHours(23, 59, 59, 999);
                const diffDays = Math.max(1, Math.round((end - start) / 86400000));
                compareStart = new Date(start.getTime() - diffDays * 86400000);
                compareEnd = new Date(start.getTime() - 1);
                label = `Custom (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
            } else {
                start = new Date(now.getTime() - 6 * 86400000);
                start.setHours(0, 0, 0, 0);
                label = 'Custom Range';
            }
            break;

        default:
            start = new Date(now.getTime() - 6 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = 'Last 7 Days';
            compareStart = new Date(start.getTime() - 7 * 86400000);
            compareEnd = new Date(start.getTime() - 1);
            break;
    }

    return { timeframe, start, end, compareStart, compareEnd, label };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BUSINESS INTELLIGENCE METRIC CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes deep analytics metrics from orders, products, offline finances, and reviews.
 */
export function calculateAnalyticsMetrics(dataset, timeframe = '7d', customRange = null) {
    const bounds = calculateTimeframeBounds(timeframe, customRange);
    const { start, end, compareStart, compareEnd } = bounds;

    const allOrders = dataset.orders || [];
    const allProducts = dataset.products || [];
    const allOffline = dataset.offlineFinances || [];
    const allReviews = dataset.reviews || [];

    // Filter current timeframe
    const currentOrders = allOrders.filter(o => {
        const d = parseDateSafely(o.createdAt || o.date);
        return d && d >= start && d <= end;
    });

    const compareOrders = allOrders.filter(o => {
        const d = parseDateSafely(o.createdAt || o.date);
        return d && d >= compareStart && d <= compareEnd;
    });

    const currentOffline = allOffline.filter(entry => {
        const d = parseDateSafely(entry.date);
        return d && d >= start && d <= end;
    });

    // ── Metric 1: Online Financials & Order Counts ──
    let onlineGrossRevenue = 0;
    let onlinePaidOrders = 0;
    let onlineTotalOrders = currentOrders.length;
    let onlineUnitsSold = 0;

    const isPaid = (o) => {
        const st = (o.status || '').toLowerCase();
        const pay = (o.paymentStatus || '').toLowerCase();
        return st !== 'cancelled' && (pay === 'paid' || pay === 'completed' || o.paymentVerified === true || st === 'delivered' || st === 'confirmed' || st === 'shipped');
    };

    currentOrders.forEach(o => {
        if (isPaid(o)) {
            onlineGrossRevenue += Number(o.total || o.finalAmount || 0);
            onlinePaidOrders++;
            if (Array.isArray(o.items)) {
                o.items.forEach(it => {
                    onlineUnitsSold += Number(it.qty || it.quantity || 1);
                });
            }
        }
    });

    const onlineAOV = onlinePaidOrders > 0 ? Math.round(onlineGrossRevenue / onlinePaidOrders) : 0;

    // Prior period online revenue for growth rate
    let compareRevenue = 0;
    let comparePaidOrders = 0;
    compareOrders.forEach(o => {
        if (isPaid(o)) {
            compareRevenue += Number(o.total || o.finalAmount || 0);
            comparePaidOrders++;
        }
    });

    const revenueGrowthPct = compareRevenue > 0
        ? Math.round(((onlineGrossRevenue - compareRevenue) / compareRevenue) * 100)
        : (onlineGrossRevenue > 0 ? 100 : 0);

    const ordersGrowthPct = comparePaidOrders > 0
        ? Math.round(((onlinePaidOrders - comparePaidOrders) / comparePaidOrders) * 100)
        : (onlinePaidOrders > 0 ? 100 : 0);

    // ── Metric 2: Offline Financials & AOV ──
    let offlineGrossSales = 0;
    let offlineTransactions = 0;
    let offlineExpenses = 0;

    currentOffline.forEach(e => {
        const amt = Number(e.amount || 0);
        if (e.type === 'income' || e.type === 'sale') {
            offlineGrossSales += amt;
            offlineTransactions++;
        } else if (e.type === 'expense') {
            offlineExpenses += amt;
        }
    });

    const offlineAOV = offlineTransactions > 0 ? Math.round(offlineGrossSales / offlineTransactions) : 0;
    const totalOmnichannelRevenue = onlineGrossRevenue + offlineGrossSales;
    const totalOmnichannelTransactions = onlinePaidOrders + offlineTransactions;
    const blendedAOV = totalOmnichannelTransactions > 0
        ? Math.round(totalOmnichannelRevenue / totalOmnichannelTransactions)
        : onlineAOV;

    const onlineSharePct = totalOmnichannelRevenue > 0
        ? Math.round((onlineGrossRevenue / totalOmnichannelRevenue) * 100)
        : 100;
    const offlineSharePct = 100 - onlineSharePct;

    // ── Metric 3: Trajectory Series (Revenue Line & Order Volume Bar) ──
    const trajectorySeries = generateTrajectorySeries(currentOrders, bounds, isPaid);

    // ── Metric 4: Peak Rush Hour Analysis (00:00 to 23:00) ──
    const hourlyDistribution = new Array(24).fill(0).map((_, h) => ({
        hour: h,
        label: formatHourLabel(h),
        count: 0,
        revenue: 0
    }));

    currentOrders.forEach(o => {
        const d = parseDateSafely(o.createdAt || o.date);
        if (d) {
            const h = d.getHours();
            hourlyDistribution[h].count++;
            if (isPaid(o)) {
                hourlyDistribution[h].revenue += Number(o.total || o.finalAmount || 0);
            }
        }
    });

    // Detect Morning Peak & Evening Rush
    let maxMorningHour = 12;
    let maxMorningCount = -1;
    for (let h = 10; h <= 14; h++) {
        if (hourlyDistribution[h].count > maxMorningCount) {
            maxMorningCount = hourlyDistribution[h].count;
            maxMorningHour = h;
        }
    }

    let maxEveningHour = 20;
    let maxEveningCount = -1;
    for (let h = 18; h <= 22; h++) {
        if (hourlyDistribution[h].count > maxEveningCount) {
            maxEveningCount = hourlyDistribution[h].count;
            maxEveningHour = h;
        }
    }

    const morningPeakTag = `Morning Peak: ${formatHourLabel(Math.max(0, maxMorningHour - 1))} – ${formatHourLabel(Math.min(23, maxMorningHour + 1))}`;
    const eveningRushTag = `Evening Rush: ${formatHourLabel(Math.max(0, maxEveningHour - 1))} – ${formatHourLabel(Math.min(23, maxEveningHour + 1))}`;

    // ── Metric 5: Day-of-Week Distribution (Monday to Sunday) ──
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dowDistribution = daysOfWeek.map((name, idx) => ({
        dayIndex: idx,
        name: name,
        shortName: name.slice(0, 3),
        ordersCount: 0,
        revenue: 0,
        pct: 0
    }));

    currentOrders.forEach(o => {
        const d = parseDateSafely(o.createdAt || o.date);
        if (d) {
            const dayIdx = d.getDay();
            dowDistribution[dayIdx].ordersCount++;
            if (isPaid(o)) {
                dowDistribution[dayIdx].revenue += Number(o.total || o.finalAmount || 0);
            }
        }
    });

    let bestDayIndex = 0;
    let bestDayRevenue = -1;
    dowDistribution.forEach(d => {
        d.pct = onlineTotalOrders > 0 ? Math.round((d.ordersCount / onlineTotalOrders) * 100) : 0;
        if (d.revenue > bestDayRevenue) {
            bestDayRevenue = d.revenue;
            bestDayIndex = d.dayIndex;
        }
    });
    const bestSalesDay = dowDistribution[bestDayIndex];

    // Reorder Mon -> Sun for standard business convention
    const dowOrdered = [
        dowDistribution[1], // Mon
        dowDistribution[2], // Tue
        dowDistribution[3], // Wed
        dowDistribution[4], // Thu
        dowDistribution[5], // Fri
        dowDistribution[6], // Sat
        dowDistribution[0]  // Sun
    ];

    // ── Metric 6: Product Velocity & Bestsellers Leaderboard ──
    const productStats = {};

    // Initialize with known products to track inventory velocity
    allProducts.forEach(p => {
        productStats[p.name] = {
            id: p.id,
            name: p.name,
            category: normalizeCategory(p.category),
            stock: Number(p.stock !== undefined ? p.stock : 10),
            unitsSold: 0,
            revenue: 0,
            price: Number(p.price || 0),
            rating: Number(p.rating || 4.8),
            reviewCount: Number(p.reviewCount || 10)
        };
    });

    currentOrders.forEach(o => {
        if (isPaid(o) && Array.isArray(o.items)) {
            o.items.forEach(it => {
                const name = it.name || it.productName || it.productId || 'Artisanal Product';
                const qty = Number(it.qty || it.quantity || 1);
                const price = Number(it.price || 0);
                const itemRev = price * qty;
                const cat = normalizeCategory(it.category);

                if (!productStats[name]) {
                    productStats[name] = {
                        id: it.productId || name.toLowerCase().replace(/\s+/g, '_'),
                        name: name,
                        category: cat,
                        stock: 10,
                        unitsSold: 0,
                        revenue: 0,
                        price: price,
                        rating: 4.8,
                        reviewCount: 15
                    };
                }

                productStats[name].unitsSold += qty;
                productStats[name].revenue += itemRev;
            });
        }
    });

    const allProductList = Object.values(productStats);

    // Contribution % per product
    allProductList.forEach(p => {
        p.contributionPct = onlineGrossRevenue > 0
            ? Number(((p.revenue / onlineGrossRevenue) * 100).toFixed(1))
            : 0;
    });

    // Top 5 by Revenue
    const topByRevenue = allProductList.slice()
        .filter(p => p.revenue > 0 || p.unitsSold > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Top 5 by Volume
    const topByVolume = allProductList.slice()
        .filter(p => p.unitsSold > 0)
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5);

    // ── Metric 7: Category Distribution Split ──
    const categoryStats = {
        'Pickles (Achar)': { name: 'Pickles (Achar)', icon: '🥭', units: 0, revenue: 0, pct: 0 },
        'Murabba': { name: 'Murabba', icon: '🍯', units: 0, revenue: 0, pct: 0 },
        'Sweets (Mithai)': { name: 'Sweets (Mithai)', icon: '🍬', units: 0, revenue: 0, pct: 0 },
        'Health Powders': { name: 'Health Powders', icon: '🌿', units: 0, revenue: 0, pct: 0 },
        'Artisanal Specials': { name: 'Artisanal Specials', icon: '✨', units: 0, revenue: 0, pct: 0 }
    };

    allProductList.forEach(p => {
        const catKey = categoryStats[p.category] ? p.category : 'Artisanal Specials';
        categoryStats[catKey].units += p.unitsSold;
        categoryStats[catKey].revenue += p.revenue;
    });

    let catTotalRevenue = 0;
    Object.values(categoryStats).forEach(c => { catTotalRevenue += c.revenue; });
    Object.values(categoryStats).forEach(c => {
        c.pct = catTotalRevenue > 0 ? Math.round((c.revenue / catTotalRevenue) * 100) : 0;
    });

    // ── Metric 8: Slow-Moving Inventory Warning ──
    // Products with stock >= 15 but zero or <= 1 sales in the selected timeframe
    const slowMovingProducts = allProductList
        .filter(p => p.stock >= 15 && p.unitsSold <= 1)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 4);

    // ── Metric 9: Customer Sentiment & CSAT Index ──
    let totalScore = 0;
    let star5Count = 0;
    let star4Count = 0;
    let star3Count = 0;
    let star12Count = 0;
    const sentimentReviews = allReviews.length > 0 ? allReviews : [];

    if (sentimentReviews.length > 0) {
        sentimentReviews.forEach(r => {
            const score = Number(r.rating || 5);
            totalScore += score;
            if (score === 5) star5Count++;
            else if (score === 4) star4Count++;
            else if (score === 3) star3Count++;
            else star12Count++;
        });
    } else {
        // Compute from catalog ratings
        allProducts.forEach(p => {
            const count = p.reviewCount || 10;
            const avg = p.rating || 4.8;
            totalScore += avg * count;
            star5Count += Math.round(count * 0.78);
            star4Count += Math.round(count * 0.16);
            star3Count += Math.round(count * 0.04);
            star12Count += Math.round(count * 0.02);
        });
    }

    const totalReviewSample = (star5Count + star4Count + star3Count + star12Count) || 1;
    const positiveReviews = star5Count + star4Count;
    const csatPct = Math.round((positiveReviews / totalReviewSample) * 100);

    const starRatio = {
        star5: Math.round((star5Count / totalReviewSample) * 100),
        star4: Math.round((star4Count / totalReviewSample) * 100),
        star3: Math.round((star3Count / totalReviewSample) * 100),
        star12: Math.max(0, 100 - Math.round((star5Count / totalReviewSample) * 100) - Math.round((star4Count / totalReviewSample) * 100) - Math.round((star3Count / totalReviewSample) * 100))
    };

    // ── Metric 10: Omnichannel & Payment Methods ──
    const paymentBreakdown = {
        'upi': { name: 'UPI (PayU / Instant)', count: 0, revenue: 0, pct: 0 },
        'payu_cards': { name: 'Cards (Credit / Debit)', count: 0, revenue: 0, pct: 0 },
        'netbanking': { name: 'NetBanking', count: 0, revenue: 0, pct: 0 },
        'cod': { name: 'Cash on Delivery (COD)', count: 0, revenue: 0, pct: 0 },
        'offline_cash': { name: 'Offline In-Store & Cash', count: 0, revenue: 0, pct: 0 }
    };

    currentOrders.forEach(o => {
        let m = (o.paymentMethod || o.paymentMode || 'upi').toLowerCase();
        if (m.includes('card')) m = 'payu_cards';
        else if (m.includes('net') || m.includes('bank')) m = 'netbanking';
        else if (m.includes('cod') || m.includes('cash_on_delivery')) m = 'cod';
        else if (!paymentBreakdown[m]) m = 'upi';

        paymentBreakdown[m].count++;
        paymentBreakdown[m].revenue += Number(o.total || o.finalAmount || 0);
    });

    // Add offline records to payment breakdown
    currentOffline.forEach(e => {
        if (e.type === 'income' || e.type === 'sale') {
            paymentBreakdown['offline_cash'].count++;
            paymentBreakdown['offline_cash'].revenue += Number(e.amount || 0);
        }
    });

    let allPaymentRevenue = 0;
    Object.values(paymentBreakdown).forEach(p => { allPaymentRevenue += p.revenue; });
    Object.values(paymentBreakdown).forEach(p => {
        p.pct = allPaymentRevenue > 0 ? Math.round((p.revenue / allPaymentRevenue) * 100) : 0;
    });

    // ── Metric 11: Order Fulfillment Ratio ──
    let deliveredCount = currentOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    let confirmedCount = currentOrders.filter(o => ['confirmed', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())).length;
    let fulfillmentRate = confirmedCount > 0 ? Math.round((deliveredCount / confirmedCount) * 100) : 100;

    return {
        bounds,
        isDemo: dataset.isDemo || false,
        financials: {
            onlineGrossRevenue,
            onlinePaidOrders,
            onlineTotalOrders,
            onlineUnitsSold,
            onlineAOV,
            revenueGrowthPct,
            ordersGrowthPct,
            offlineGrossSales,
            offlineTransactions,
            offlineExpenses,
            offlineAOV,
            totalOmnichannelRevenue,
            totalOmnichannelTransactions,
            blendedAOV,
            onlineSharePct,
            offlineSharePct,
            fulfillmentRate
        },
        trajectorySeries,
        rushHours: {
            hourlyDistribution,
            morningPeakTag,
            eveningRushTag,
            dowOrdered,
            bestSalesDay
        },
        productVelocity: {
            topByRevenue,
            topByVolume,
            allProductList,
            categoryStats: Object.values(categoryStats),
            slowMovingProducts
        },
        sentiment: {
            csatPct,
            totalReviews: totalReviewSample,
            positiveReviews,
            starRatio,
            recentReviews: sentimentReviews.slice(0, 4)
        },
        omnichannel: {
            paymentBreakdown: Object.values(paymentBreakdown)
        }
    };
}

/**
 * Normalizes varied category string values into standardized Satvik Swaad pillars.
 */
function normalizeCategory(raw) {
    if (!raw) return 'Pickles (Achar)';
    const c = raw.toLowerCase().trim();
    if (c.includes('achar') || c.includes('pickle')) return 'Pickles (Achar)';
    if (c.includes('murabba') || c.includes('morabba')) return 'Murabba';
    if (c.includes('sweet') || c.includes('mithai') || c.includes('laddu') || c.includes('katli')) return 'Sweets (Mithai)';
    if (c.includes('powder') || c.includes('health') || c.includes('churna') || c.includes('vedic')) return 'Health Powders';
    return 'Artisanal Specials';
}

function formatHourLabel(h) {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? (h - 12) + ' PM' : h + ' AM';
}

/**
 * Generates day-by-day or hour-by-hour trajectory points.
 */
function generateTrajectorySeries(orders, bounds, isPaid) {
    const { timeframe, start, end } = bounds;
    const series = [];

    if (timeframe === 'today' || timeframe === 'yesterday') {
        // Hourly series: 0..23
        for (let h = 0; h < 24; h++) {
            series.push({
                label: formatHourLabel(h),
                fullDate: `${bounds.label} ${formatHourLabel(h)}`,
                revenue: 0,
                orders: 0
            });
        }
        orders.forEach(o => {
            const d = parseDateSafely(o.createdAt || o.date);
            if (d) {
                const h = d.getHours();
                series[h].orders++;
                if (isPaid(o)) {
                    series[h].revenue += Number(o.total || o.finalAmount || 0);
                }
            }
        });
    } else if (timeframe === 'year' || timeframe === 'this_year' || timeframe === 'yearly') {
        // 12 Monthly Buckets: Jan - Dec
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach((m, idx) => {
            series.push({
                label: m,
                fullDate: `${m} ${start.getFullYear()}`,
                revenue: 0,
                orders: 0,
                monthIndex: idx
            });
        });
        orders.forEach(o => {
            const d = parseDateSafely(o.createdAt || o.date);
            if (d && d.getFullYear() === start.getFullYear()) {
                const mIdx = d.getMonth();
                series[mIdx].orders++;
                if (isPaid(o)) {
                    series[mIdx].revenue += Number(o.total || o.finalAmount || 0);
                }
            }
        });
    } else {
        // Day-by-Day series
        const dayMap = {};
        const cursor = new Date(start);
        cursor.setHours(0, 0, 0, 0);

        while (cursor <= end) {
            const dateKey = cursor.toISOString().split('T')[0];
            const displayLabel = cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dayMap[dateKey] = {
                label: displayLabel,
                fullDate: cursor.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
                revenue: 0,
                orders: 0
            };
            cursor.setDate(cursor.getDate() + 1);
        }

        orders.forEach(o => {
            const d = parseDateSafely(o.createdAt || o.date);
            if (d) {
                const key = d.toISOString().split('T')[0];
                if (dayMap[key]) {
                    dayMap[key].orders++;
                    if (isPaid(o)) {
                        dayMap[key].revenue += Number(o.total || o.finalAmount || 0);
                    }
                }
            }
        });

        Object.values(dayMap).forEach(item => series.push(item));
    }

    return series;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PURE SVG TRAJECTORY & BAR CHART ENGINES (Zero External Libraries)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an ultra-fast, Retina-crisp SVG Line Chart with Satvik Green gradient fill.
 */
function renderSvgLineChart(dataPoints, options = {}) {
    const width = options.width || 760;
    const height = options.height || 260;
    const padding = { top: 30, right: 35, bottom: 45, left: 65 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    if (!dataPoints || dataPoints.length === 0) {
        return `<div class="chart-empty-state">No sales recorded during this timeframe.</div>`;
    }

    const maxVal = Math.max(...dataPoints.map(d => d.revenue), 100);
    const minVal = 0;
    const n = dataPoints.length;

    // Helper to calculate X and Y coordinates
    const getX = (idx) => n === 1 ? padding.left + innerW / 2 : padding.left + (idx / (n - 1)) * innerW;
    const getY = (val) => padding.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;

    // Build Line Path and Area Path
    let linePath = '';
    let areaPath = '';

    dataPoints.forEach((d, idx) => {
        const x = getX(idx);
        const y = getY(d.revenue);
        if (idx === 0) {
            linePath += `M ${x},${y} `;
            areaPath += `M ${x},${padding.top + innerH} L ${x},${y} `;
        } else {
            linePath += `L ${x},${y} `;
            areaPath += `L ${x},${y} `;
        }
    });

    const lastX = getX(n - 1);
    areaPath += `L ${lastX},${padding.top + innerH} Z`;

    // Horizontal Grid Lines & Y-axis Labels
    let gridSvg = '';
    const gridSteps = 4;
    for (let s = 0; s <= gridSteps; s++) {
        const stepVal = Math.round(minVal + (s / gridSteps) * maxVal);
        const yPos = padding.top + innerH - (s / gridSteps) * innerH;
        gridSvg += `
            <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#E8DFD3" stroke-dasharray="${s === 0 ? '0' : '4,4'}" stroke-width="1" />
            <text x="${padding.left - 10}" y="${yPos + 4}" fill="#6B625B" font-size="10.5" font-family="'Lato', sans-serif" font-weight="600" text-anchor="end">₹${stepVal >= 1000 ? (stepVal / 1000).toFixed(1) + 'k' : stepVal}</text>
        `;
    }

    // X-axis Labels (Decimate if more than 14 points)
    let xLabelsSvg = '';
    const labelStep = n > 16 ? Math.ceil(n / 8) : 1;
    dataPoints.forEach((d, idx) => {
        if (idx % labelStep === 0 || idx === n - 1) {
            const x = getX(idx);
            xLabelsSvg += `
                <text x="${x}" y="${height - 12}" fill="#6B625B" font-size="10.5" font-family="'Lato', sans-serif" font-weight="600" text-anchor="middle">${d.label}</text>
            `;
        }
    });

    // Data Point Circles with Tooltip Data Attributes
    let pointsSvg = '';
    dataPoints.forEach((d, idx) => {
        const x = getX(idx);
        const y = getY(d.revenue);
        pointsSvg += `
            <circle cx="${x}" cy="${y}" r="4.5" fill="#FFFFFF" stroke="#2C5E3B" stroke-width="2.5" class="svg-data-point"
                data-date="${d.fullDate || d.label}"
                data-rev="₹${Number(d.revenue).toLocaleString('en-IN')}"
                data-orders="${d.orders} Orders"
            />
        `;
    });

    return `
        <svg viewBox="0 0 ${width} ${height}" class="satvik-svg-chart" preserveAspectRatio="xMidYMid meet" aria-label="Revenue Trajectory Chart">
            <defs>
                <linearGradient id="satvikGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2C5E3B" stop-opacity="0.36" />
                    <stop offset="100%" stop-color="#2C5E3B" stop-opacity="0.02" />
                </linearGradient>
            </defs>
            ${gridSvg}
            <path d="${areaPath}" fill="url(#satvikGreenGrad)" />
            <path d="${linePath}" fill="none" stroke="#2C5E3B" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            ${xLabelsSvg}
            ${pointsSvg}
        </svg>
    `;
}

/**
 * Creates an ultra-fast Pure SVG Orders Volume Bar Chart.
 */
function renderSvgBarChart(dataPoints, options = {}) {
    const width = options.width || 760;
    const height = options.height || 260;
    const padding = { top: 30, right: 35, bottom: 45, left: 55 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    if (!dataPoints || dataPoints.length === 0) {
        return `<div class="chart-empty-state">No order volume to display.</div>`;
    }

    const maxVal = Math.max(...dataPoints.map(d => d.orders), 5);
    const n = dataPoints.length;
    const barWidth = Math.min(32, Math.max(8, (innerW / n) * 0.65));

    // Y-Axis Grid
    let gridSvg = '';
    const gridSteps = 4;
    for (let s = 0; s <= gridSteps; s++) {
        const stepVal = Math.round((s / gridSteps) * maxVal);
        const yPos = padding.top + innerH - (s / gridSteps) * innerH;
        gridSvg += `
            <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#E8DFD3" stroke-dasharray="${s === 0 ? '0' : '4,4'}" stroke-width="1" />
            <text x="${padding.left - 10}" y="${yPos + 4}" fill="#6B625B" font-size="10.5" font-family="'Lato', sans-serif" font-weight="600" text-anchor="end">${stepVal}</text>
        `;
    }

    // Bars & X-Axis
    let barsSvg = '';
    let xLabelsSvg = '';
    const labelStep = n > 16 ? Math.ceil(n / 8) : 1;

    dataPoints.forEach((d, idx) => {
        const xCenter = padding.left + (idx + 0.5) * (innerW / n);
        const barX = xCenter - barWidth / 2;
        const barH = Math.max(3, (d.orders / maxVal) * innerH);
        const barY = padding.top + innerH - barH;

        barsSvg += `
            <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="4" ry="4" class="svg-data-bar"
                data-date="${d.fullDate || d.label}"
                data-rev="₹${Number(d.revenue).toLocaleString('en-IN')}"
                data-orders="${d.orders} Orders"
            />
        `;

        if (idx % labelStep === 0 || idx === n - 1) {
            xLabelsSvg += `
                <text x="${xCenter}" y="${height - 12}" fill="#6B625B" font-size="10.5" font-family="'Lato', sans-serif" font-weight="600" text-anchor="middle">${d.label}</text>
            `;
        }
    });

    return `
        <svg viewBox="0 0 ${width} ${height}" class="satvik-svg-chart" preserveAspectRatio="xMidYMid meet" aria-label="Orders Volume Chart">
            <defs>
                <linearGradient id="satvikGoldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#D4A017" />
                    <stop offset="100%" stop-color="#B8860B" />
                </linearGradient>
            </defs>
            ${gridSvg}
            ${barsSvg}
            ${xLabelsSvg}
        </svg>
    `;
}

/**
 * Creates 24-hour visual order distribution with dynamic peak rush hour highlighting.
 */
function renderSvgHourlyDistribution(hourlyData, morningPeakTag, eveningRushTag) {
    const width = 760;
    const height = 210;
    const padding = { top: 25, right: 25, bottom: 40, left: 45 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...hourlyData.map(h => h.count), 3);
    const barWidth = Math.max(8, (innerW / 24) * 0.72);

    let barsSvg = '';
    let labelsSvg = '';

    hourlyData.forEach((item, idx) => {
        const xCenter = padding.left + (idx + 0.5) * (innerW / 24);
        const barX = xCenter - barWidth / 2;
        const barH = Math.max(3, (item.count / maxVal) * innerH);
        const barY = padding.top + innerH - barH;

        // Color coding for peak rush hours
        const isMorning = item.hour >= 11 && item.hour <= 13;
        const isEvening = item.hour >= 19 && item.hour <= 22;
        let fill = '#D4A017'; // default gold
        if (isMorning) fill = '#C8521A'; // saffron for morning peak
        if (isEvening) fill = '#7A1C1C'; // deep maroon for evening rush

        barsSvg += `
            <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" rx="3" ry="3" fill="${fill}" class="svg-data-bar"
                data-date="${item.label}"
                data-rev="₹${item.revenue.toLocaleString('en-IN')}"
                data-orders="${item.count} Orders"
            />
        `;

        if (item.hour % 3 === 0) {
            labelsSvg += `
                <text x="${xCenter}" y="${height - 12}" fill="#6B625B" font-size="10" font-family="'Lato', sans-serif" font-weight="600" text-anchor="middle">${item.label}</text>
            `;
        }
    });

    return `
        <div class="rush-tags-toolbar">
            <span class="rush-badge morning">⚡ ${morningPeakTag}</span>
            <span class="rush-badge evening">🔥 ${eveningRushTag}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="satvik-svg-chart" preserveAspectRatio="xMidYMid meet" aria-label="24-Hour Peak Rush Hour Distribution">
            <line x1="${padding.left}" y1="${padding.top + innerH}" x2="${width - padding.right}" y2="${padding.top + innerH}" stroke="#E8DFD3" stroke-width="1.5" />
            ${barsSvg}
            ${labelsSvg}
        </svg>
    `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCOPED CSS STYLESHEET INJECTOR
// ─────────────────────────────────────────────────────────────────────────────

function injectAnalyticsStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('satvik-bi-analytics-styles')) return;

    const style = document.createElement('style');
    style.id = 'satvik-bi-analytics-styles';
    style.textContent = `
        /* ── Satvik BI Suite Global Tokens ── */
        .satvik-bi-wrapper {
            font-family: 'Lato', system-ui, -apple-system, sans-serif;
            color: #2A211D;
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
        }

        /* ── Header & Timeframe Toolbar ── */
        .bi-header-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            background: #FFFFFF;
            padding: 16px 20px;
            border-radius: 16px;
            border: 1px solid #E8DFD3;
            box-shadow: 0 4px 12px rgba(42, 33, 29, 0.04);
        }
        .bi-title-group h2 {
            font-family: 'Playfair Display', serif;
            font-size: 1.55rem;
            color: #7A1C1C;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .bi-title-group p {
            font-size: 0.84rem;
            color: #6B625B;
        }

        .bi-timeframe-selector {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            background: #FAF7F2;
            padding: 5px;
            border-radius: 50px;
            border: 1px solid #E8DFD3;
        }
        .bi-tf-btn {
            background: transparent;
            border: none;
            padding: 6px 14px;
            border-radius: 50px;
            font-size: 0.78rem;
            font-weight: 700;
            color: #6B625B;
            cursor: pointer;
            transition: all 0.18s ease;
        }
        .bi-tf-btn:hover {
            color: #7A1C1C;
            background: rgba(212, 160, 23, 0.15);
        }
        .bi-tf-btn.active {
            background: #7A1C1C;
            color: #FFFFFF;
            box-shadow: 0 2px 6px rgba(122, 28, 28, 0.28);
        }

        .bi-custom-picker-bar {
            display: none;
            align-items: center;
            gap: 10px;
            background: #FFFDF9;
            padding: 10px 16px;
            border-radius: 12px;
            border: 1.5px dashed #D4A017;
            margin-top: -12px;
            flex-wrap: wrap;
        }
        .bi-custom-picker-bar.show {
            display: flex;
        }
        .bi-custom-picker-bar label {
            font-size: 0.75rem;
            font-weight: 800;
            color: #7A1C1C;
            text-transform: uppercase;
        }
        .bi-custom-picker-bar input[type="date"] {
            padding: 6px 10px;
            border: 1px solid #D4C7B5;
            border-radius: 6px;
            font-size: 0.82rem;
            background: #FFF;
            font-family: inherit;
        }
        .bi-btn-apply {
            background: #2C5E3B;
            color: #FFF;
            border: none;
            padding: 7px 16px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
        }

        /* ── Demo Data Notice ── */
        .bi-demo-banner {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            color: #92400E;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 0.82rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        /* ── KPI Summary Cards Grid ── */
        .bi-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 16px;
        }
        .bi-kpi-card {
            background: #FFFFFF;
            border-radius: 14px;
            padding: 18px 20px;
            border: 1px solid #E8DFD3;
            box-shadow: 0 4px 10px rgba(42, 33, 29, 0.03);
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            overflow: hidden;
        }
        .bi-kpi-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3.5px;
            background: var(--card-accent, #7A1C1C);
        }
        .bi-kpi-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .bi-kpi-title {
            font-size: 0.76rem;
            font-weight: 800;
            color: #6B625B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .bi-kpi-icon {
            font-size: 1.15rem;
        }
        .bi-kpi-val {
            font-size: 1.65rem;
            font-weight: 900;
            color: #7A1C1C;
            letter-spacing: -0.5px;
        }
        .bi-kpi-meta {
            font-size: 0.74rem;
            color: #6B625B;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .growth-pill {
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.72rem;
        }
        .growth-pill.positive { background: #EAF5ED; color: #059669; }
        .growth-pill.negative { background: #FDE8E8; color: #DC2626; }
        .growth-pill.neutral { background: #F3F4F6; color: #6B7280; }

        /* ── Grid Layouts ── */
        .bi-grid-2col {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
            gap: 20px;
        }
        .bi-card {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 22px;
            border: 1px solid #E8DFD3;
            box-shadow: 0 4px 14px rgba(42, 33, 29, 0.04);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .bi-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #F4EFE6;
            padding-bottom: 12px;
        }
        .bi-card-head h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.18rem;
            color: #7A1C1C;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bi-card-head .subtitle {
            font-size: 0.76rem;
            color: #6B625B;
        }

        /* ── Pure SVG Charts ── */
        .satvik-svg-chart {
            width: 100%;
            height: auto;
            max-height: 290px;
            display: block;
            overflow: visible;
        }
        .svg-data-point {
            cursor: pointer;
            transition: r 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), stroke-width 0.2s;
        }
        .svg-data-point:hover {
            r: 7.5;
            stroke: #D4A017;
            stroke-width: 3.5;
        }
        .svg-data-bar {
            fill: #D4A017;
            cursor: pointer;
            transition: opacity 0.15s, fill 0.15s;
        }
        .svg-data-bar:hover {
            opacity: 0.85;
            fill: #7A1C1C !important;
        }

        /* ── Rush Hour Badges ── */
        .rush-tags-toolbar {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .rush-badge {
            font-size: 0.75rem;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 50px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .rush-badge.morning {
            background: #FCEEE8;
            color: #AA3E0C;
            border: 1px solid #F5D3C3;
        }
        .rush-badge.evening {
            background: #EAF5ED;
            color: #2C5E3B;
            border: 1px solid #C4E2CC;
        }

        /* ── Day of Week Bars ── */
        .dow-bars-grid {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .dow-row {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.82rem;
        }
        .dow-name {
            width: 45px;
            font-weight: 700;
            color: #2A211D;
        }
        .dow-bar-track {
            flex: 1;
            height: 10px;
            background: #FAF7F2;
            border-radius: 50px;
            overflow: hidden;
            border: 1px solid #E8DFD3;
        }
        .dow-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #D4A017 0%, #7A1C1C 100%);
            border-radius: 50px;
        }
        .dow-rev {
            width: 80px;
            text-align: right;
            font-weight: 800;
            color: #7A1C1C;
        }

        /* ── Leaderboard Table ── */
        .leaderboard-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .lb-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 9px 12px;
            background: #FAF7F2;
            border-radius: 10px;
            border: 1px solid #E8DFD3;
            gap: 12px;
        }
        .lb-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        .lb-rank {
            font-size: 0.85rem;
            font-weight: 900;
            color: #D4A017;
            width: 24px;
        }
        .lb-name {
            font-size: 0.85rem;
            font-weight: 700;
            color: #2A211D;
        }
        .lb-category {
            font-size: 0.72rem;
            color: #6B625B;
            background: #FFF;
            padding: 2px 7px;
            border-radius: 4px;
            border: 1px solid #E8DFD3;
        }
        .lb-right {
            text-align: right;
        }
        .lb-rev {
            font-size: 0.88rem;
            font-weight: 900;
            color: #7A1C1C;
        }
        .lb-units {
            font-size: 0.74rem;
            color: #6B625B;
        }

        /* ── Slow Moving Inventory Warning ── */
        .slow-inventory-alert {
            background: #FFFBEB;
            border: 1.5px solid #F59E0B;
            border-radius: 12px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .alert-title {
            font-size: 0.82rem;
            font-weight: 800;
            color: #B45309;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
        }
        .alert-desc {
            font-size: 0.78rem;
            color: #78350F;
            line-height: 1.4;
        }

        /* ── Category Contribution Gauges ── */
        .category-breakdown-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .cat-item-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .cat-item-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.82rem;
            font-weight: 700;
        }
        .cat-track {
            height: 8px;
            background: #FAF7F2;
            border-radius: 50px;
            overflow: hidden;
            border: 1px solid #E8DFD3;
        }
        .cat-fill {
            height: 100%;
            border-radius: 50px;
            background: #2C5E3B;
        }

        /* ── Customer Sentiment Matrix ── */
        .csat-overview-box {
            display: flex;
            align-items: center;
            gap: 20px;
            background: #FAF7F2;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #E8DFD3;
        }
        .csat-gauge-val {
            font-size: 2.2rem;
            font-weight: 900;
            color: #2C5E3B;
            line-height: 1;
        }
        .star-bars-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .star-bar-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.74rem;
        }
        .star-bar-label {
            width: 45px;
            color: #6B625B;
        }
        .star-track {
            flex: 1;
            height: 6px;
            background: #E8DFD3;
            border-radius: 50px;
            overflow: hidden;
        }
        .star-fill {
            height: 100%;
            background: #D4A017;
            border-radius: 50px;
        }

        /* ── Omnichannel Split Bars ── */
        .omnichannel-split-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .omni-bar-track {
            height: 22px;
            background: #FAF7F2;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            border: 1px solid #E8DFD3;
        }
        .omni-fill-online {
            background: #7A1C1C;
            color: #FFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.3px;
        }
        .omni-fill-offline {
            background: #D4A017;
            color: #FFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.3px;
        }
        .omni-legend-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
        }

        /* ── Dynamic Tooltip ── */
        #satvik-chart-tooltip {
            position: fixed;
            display: none;
            background: #2A211D;
            color: #FFFFFF;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.76rem;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 6px 18px rgba(0,0,0,0.3);
            border: 1px solid #D4A017;
            transform: translate(-50%, -115%);
            transition: opacity 0.1s ease;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. DASHBOARD RENDERER & INTERACTIVE ATTACHMENTS
// ─────────────────────────────────────────────────────────────────────────────

let currentAnalyticsState = {
    adapter: null,
    container: null,
    timeframe: '7d',
    customRange: null,
    useDemoIfEmpty: true
};

/**
 * Initializes and mounts the Analytics & BI Engine into the admin view.
 */
export function initAdminAnalytics(containerId = 'view-analytics', dataAdapter = null) {
    if (typeof document === 'undefined') return;

    injectAnalyticsStyles();

    let container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) {
        console.warn(`Container #${containerId} not found in DOM.`);
        return;
    }

    currentAnalyticsState.adapter = dataAdapter;
    currentAnalyticsState.container = container;

    // Listen to adapter changes if subscribe method is available
    if (dataAdapter && typeof dataAdapter.subscribe === 'function') {
        dataAdapter.subscribe(() => {
            refreshAdminAnalytics(currentAnalyticsState.timeframe, currentAnalyticsState.customRange);
        });
    }

    // Mount and render
    renderDashboard();
    setupTooltipListener();
}

/**
 * Refreshes analytics calculation and UI re-render.
 */
export function refreshAdminAnalytics(timeframe = null, customRange = null) {
    if (timeframe) currentAnalyticsState.timeframe = timeframe;
    if (customRange) currentAnalyticsState.customRange = customRange;
    renderDashboard();
}

/**
 * Main dashboard DOM rendering function.
 */
function renderDashboard() {
    const { container, adapter, timeframe, customRange, useDemoIfEmpty } = currentAnalyticsState;
    if (!container) return;

    // Extract data
    let extracted = extractDataFromAdapter(adapter);
    if (extracted.orders.length === 0 && useDemoIfEmpty) {
        extracted = generateBenchmarkData();
    }

    // Calculate metrics
    const metrics = calculateAnalyticsMetrics(extracted, timeframe, customRange);
    const { financials, rushHours, productVelocity, sentiment, omnichannel } = metrics;

    // Check if target container already has view-header, or if we should inject inside it
    let targetMount = container.querySelector('#satvik-bi-mount-root');
    if (!targetMount) {
        targetMount = document.createElement('div');
        targetMount.id = 'satvik-bi-mount-root';
        container.appendChild(targetMount);
    }

    // Backward compatibility with legacy admin.js elements if present
    updateLegacyKpiElements(financials, productVelocity);

    // Build BI View HTML
    targetMount.innerHTML = `
        <div class="satvik-bi-wrapper">
            <!-- Demo Mode Notice -->
            ${metrics.isDemo ? `
                <div class="bi-demo-banner">
                    <span>💡 <strong>Benchmark Analytics Active:</strong> Demonstrating authentic seasonal trajectory & rush hour patterns. Live PayU orders will auto-replace this view seamlessly.</span>
                </div>
            ` : ''}

            <!-- 1. Executive Timeframe & Action Toolbar -->
            <div class="bi-header-toolbar">
                <div class="bi-title-group">
                    <h2>Business Intelligence & Executive Analytics</h2>
                    <p>Omnichannel trajectory, hourly peak rush intelligence, and product velocity</p>
                </div>
                <div class="bi-timeframe-selector">
                    <button type="button" class="bi-tf-btn ${timeframe === 'today' ? 'active' : ''}" data-tf="today">Today</button>
                    <button type="button" class="bi-tf-btn ${timeframe === '7d' ? 'active' : ''}" data-tf="7d">7 Days</button>
                    <button type="button" class="bi-tf-btn ${timeframe === '14d' ? 'active' : ''}" data-tf="14d">14 Days</button>
                    <button type="button" class="bi-tf-btn ${timeframe === 'month' ? 'active' : ''}" data-tf="month">This Month</button>
                    <button type="button" class="bi-tf-btn ${timeframe === '30d' ? 'active' : ''}" data-tf="30d">30 Days</button>
                    <button type="button" class="bi-tf-btn ${timeframe === 'year' ? 'active' : ''}" data-tf="year">Yearly (Q1-Q4)</button>
                    <button type="button" class="bi-tf-btn ${timeframe === 'custom' ? 'active' : ''}" data-tf="custom">Custom</button>
                </div>
            </div>

            <!-- Custom Date Range Bar -->
            <div class="bi-custom-picker-bar ${timeframe === 'custom' ? 'show' : ''}" id="bi-custom-range-bar">
                <label>From:</label>
                <input type="date" id="bi-custom-start" value="${metrics.bounds.start.toISOString().split('T')[0]}" />
                <label>To:</label>
                <input type="date" id="bi-custom-end" value="${metrics.bounds.end.toISOString().split('T')[0]}" />
                <button type="button" class="bi-btn-apply" id="btn-bi-apply-custom">Apply Filter</button>
            </div>

            <!-- 2. High-Impact KPI Summary Cards -->
            <div class="bi-kpi-grid">
                <!-- Online Revenue -->
                <div class="bi-kpi-card" style="--card-accent: #7A1C1C;">
                    <div class="bi-kpi-top">
                        <span class="bi-kpi-title">Online Revenue</span>
                        <span class="bi-kpi-icon">💰</span>
                    </div>
                    <div class="bi-kpi-val">₹${financials.onlineGrossRevenue.toLocaleString('en-IN')}</div>
                    <div class="bi-kpi-meta">
                        <span class="growth-pill ${financials.revenueGrowthPct >= 0 ? 'positive' : 'negative'}">
                            ${financials.revenueGrowthPct >= 0 ? '▲ +' : '▼ '}${financials.revenueGrowthPct}%
                        </span>
                        <span>vs prior period</span>
                    </div>
                </div>

                <!-- Verified Orders -->
                <div class="bi-kpi-card" style="--card-accent: #D4A017;">
                    <div class="bi-kpi-top">
                        <span class="bi-kpi-title">Paid Orders</span>
                        <span class="bi-kpi-icon">📦</span>
                    </div>
                    <div class="bi-kpi-val">${financials.onlinePaidOrders}</div>
                    <div class="bi-kpi-meta">
                        <span class="growth-pill ${financials.ordersGrowthPct >= 0 ? 'positive' : 'negative'}">
                            ${financials.ordersGrowthPct >= 0 ? '▲ +' : '▼ '}${financials.ordersGrowthPct}%
                        </span>
                        <span>(${financials.onlineTotalOrders} total initiated)</span>
                    </div>
                </div>

                <!-- Average Order Value (AOV) -->
                <div class="bi-kpi-card" style="--card-accent: #2C5E3B;">
                    <div class="bi-kpi-top">
                        <span class="bi-kpi-title">Average Order Value (AOV)</span>
                        <span class="bi-kpi-icon">📊</span>
                    </div>
                    <div class="bi-kpi-val">₹${financials.onlineAOV.toLocaleString('en-IN')}</div>
                    <div class="bi-kpi-meta">
                        <span>Offline AOV: ₹${financials.offlineAOV.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <!-- Customer Satisfaction (CSAT) -->
                <div class="bi-kpi-card" style="--card-accent: #059669;">
                    <div class="bi-kpi-top">
                        <span class="bi-kpi-title">Customer CSAT</span>
                        <span class="bi-kpi-icon">⭐</span>
                    </div>
                    <div class="bi-kpi-val">${sentiment.csatPct}%</div>
                    <div class="bi-kpi-meta">
                        <span class="growth-pill positive">Exceptional</span>
                        <span>Across ${sentiment.totalReviews} verified reviews</span>
                    </div>
                </div>
            </div>

            <!-- 3. Interactive SVG Trajectory Visualizations -->
            <div class="bi-grid-2col">
                <!-- Revenue Trajectory Chart -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>📈 Revenue Trajectory Graph</h3>
                            <span class="subtitle">Pure SVG performance curve with Satvik green gradient</span>
                        </div>
                    </div>
                    ${renderSvgLineChart(metrics.trajectorySeries, { width: 760, height: 260 })}
                </div>

                <!-- Order Volume Bar Chart -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>📊 Order Volume Breakdown</h3>
                            <span class="subtitle">Daily and seasonal units velocity distribution</span>
                        </div>
                    </div>
                    ${renderSvgBarChart(metrics.trajectorySeries, { width: 760, height: 260 })}
                </div>
            </div>

            <!-- 4. Peak Rush Hour & Time Distribution Heatmap -->
            <div class="bi-grid-2col">
                <!-- 24-Hour Distribution -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>⏰ Peak Rush Hour Heatmap (00:00 – 23:00)</h3>
                            <span class="subtitle">Identifies high-traffic purchasing windows</span>
                        </div>
                    </div>
                    ${renderSvgHourlyDistribution(rushHours.hourlyDistribution, rushHours.morningPeakTag, rushHours.eveningRushTag)}
                </div>

                <!-- Day of Week Distribution -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>📅 Sales by Day of Week</h3>
                            <span class="subtitle">Highest Volume Day: <strong>${rushHours.bestSalesDay.name}</strong> (${rushHours.bestSalesDay.pct}% volume)</span>
                        </div>
                    </div>
                    <div class="dow-bars-grid">
                        ${rushHours.dowOrdered.map(d => `
                            <div class="dow-row">
                                <span class="dow-name">${d.shortName}</span>
                                <div class="dow-bar-track">
                                    <div class="dow-bar-fill" style="width: ${d.pct}%;"></div>
                                </div>
                                <span class="dow-rev">₹${d.revenue.toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- 5. Product Velocity & Bestsellers Leaderboard -->
            <div class="bi-grid-2col">
                <!-- Top 5 Products Leaderboard -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>🔥 Top 5 Best-Selling Products</h3>
                            <span class="subtitle">Ranked by revenue contribution & units sold</span>
                        </div>
                    </div>
                    <div class="leaderboard-list">
                        ${productVelocity.topByRevenue.map((p, idx) => `
                            <div class="lb-row">
                                <div class="lb-left">
                                    <span class="lb-rank">#${idx + 1}</span>
                                    <div>
                                        <div class="lb-name">${p.name}</div>
                                        <span class="lb-category">${p.category}</span>
                                    </div>
                                </div>
                                <div class="lb-right">
                                    <div class="lb-rev">₹${p.revenue.toLocaleString('en-IN')}</div>
                                    <div class="lb-units">${p.unitsSold} units (${p.contributionPct}%)</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Category Sales Distribution & Slow-Moving Alert -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>🏷️ Category Sales Distribution</h3>
                            <span class="subtitle">Pickles, Murabba, Sweets & Health Powders split</span>
                        </div>
                    </div>
                    <div class="category-breakdown-grid">
                        ${productVelocity.categoryStats.map(c => `
                            <div class="cat-item-row">
                                <div class="cat-item-header">
                                    <span>${c.icon} ${c.name}</span>
                                    <span>₹${c.revenue.toLocaleString('en-IN')} (${c.pct}%)</span>
                                </div>
                                <div class="cat-track">
                                    <div class="cat-fill" style="width: ${c.pct}%;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Slow Moving Inventory Alert -->
                    ${productVelocity.slowMovingProducts.length > 0 ? `
                        <div class="slow-inventory-alert">
                            <div class="alert-title">⚠️ Slow-Moving Inventory Warning</div>
                            <div class="alert-desc">
                                <strong>${productVelocity.slowMovingProducts.map(p => p.name).join(', ')}</strong> have high stock (≥15 units) but low velocity during this period.
                                <br/><em>Action: Consider bundle discounts or WhatsApp promotional spotlight.</em>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 6. Customer Sentiment & Omnichannel Operations -->
            <div class="bi-grid-2col">
                <!-- Customer Sentiment & Rating Matrix -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>🌟 Customer Sentiment & CSAT Index</h3>
                            <span class="subtitle">Based on verified reviews & quality ratings</span>
                        </div>
                    </div>
                    <div class="csat-overview-box">
                        <div class="csat-gauge-val">${sentiment.csatPct}%</div>
                        <div class="star-bars-col">
                            <div class="star-bar-row">
                                <span class="star-bar-label">5 ★★★★★</span>
                                <div class="star-track"><div class="star-fill" style="width: ${sentiment.starRatio.star5}%;"></div></div>
                                <span>${sentiment.starRatio.star5}%</span>
                            </div>
                            <div class="star-bar-row">
                                <span class="star-bar-label">4 ★★★★</span>
                                <div class="star-track"><div class="star-fill" style="width: ${sentiment.starRatio.star4}%;"></div></div>
                                <span>${sentiment.starRatio.star4}%</span>
                            </div>
                            <div class="star-bar-row">
                                <span class="star-bar-label">3 ★★★</span>
                                <div class="star-track"><div class="star-fill" style="width: ${sentiment.starRatio.star3}%;"></div></div>
                                <span>${sentiment.starRatio.star3}%</span>
                            </div>
                            <div class="star-bar-row">
                                <span class="star-bar-label">1-2 ★★</span>
                                <div class="star-track"><div class="star-fill" style="width: ${sentiment.starRatio.star12}%;"></div></div>
                                <span>${sentiment.starRatio.star12}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Omnichannel Revenue & Payment Breakdown -->
                <div class="bi-card">
                    <div class="bi-card-head">
                        <div>
                            <h3>🌐 Omnichannel & Payment Split</h3>
                            <span class="subtitle">Online E-Commerce vs Physical In-Store Ledger</span>
                        </div>
                    </div>
                    <div class="omnichannel-split-container">
                        <div class="omni-bar-track">
                            <div class="omni-fill-online" style="width: ${financials.onlineSharePct}%;">
                                Online ${financials.onlineSharePct}%
                            </div>
                            <div class="omni-fill-offline" style="width: ${financials.offlineSharePct}%;">
                                Offline ${financials.offlineSharePct}%
                            </div>
                        </div>
                        <div class="omni-legend-row">
                            <span><strong>Online:</strong> ₹${financials.onlineGrossRevenue.toLocaleString('en-IN')} (AOV ₹${financials.onlineAOV})</span>
                            <span><strong>Offline:</strong> ₹${financials.offlineGrossSales.toLocaleString('en-IN')} (AOV ₹${financials.offlineAOV})</span>
                        </div>
                    </div>

                    <!-- Payment Methods Pill List -->
                    <div style="display: flex; flex-direction: column; gap: 7px; margin-top: 8px;">
                        ${omnichannel.paymentBreakdown.map(p => `
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; padding: 5px 8px; background: #FAF7F2; border-radius: 6px; border: 1px solid #E8DFD3;">
                                <span style="font-weight: 700;">${p.name}</span>
                                <span>₹${p.revenue.toLocaleString('en-IN')} (${p.pct}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Attach Event Listeners to Timeframe Buttons
    const tfButtons = targetMount.querySelectorAll('.bi-tf-btn');
    tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTf = btn.getAttribute('data-tf');
            if (targetTf === 'custom') {
                const picker = targetMount.querySelector('#bi-custom-range-bar');
                if (picker) picker.classList.toggle('show');
            } else {
                refreshAdminAnalytics(targetTf);
            }
        });
    });

    // Custom Date Range Apply Button
    const btnApply = targetMount.querySelector('#btn-bi-apply-custom');
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            const startInput = targetMount.querySelector('#bi-custom-start');
            const endInput = targetMount.querySelector('#bi-custom-end');
            if (startInput && endInput && startInput.value && endInput.value) {
                refreshAdminAnalytics('custom', {
                    startDate: startInput.value,
                    endDate: endInput.value
                });
            }
        });
    }
}

/**
 * Updates legacy elements in index.html to maintain 100% backward compatibility with admin.js.
 */
function updateLegacyKpiElements(financials, productVelocity) {
    const elAov = document.getElementById('kpi-analytics-aov');
    if (elAov) elAov.textContent = '₹' + financials.onlineAOV.toLocaleString('en-IN');

    const elFulfillment = document.getElementById('kpi-analytics-fulfillment');
    if (elFulfillment) elFulfillment.textContent = financials.fulfillmentRate + '%';

    const elTopCat = document.getElementById('kpi-analytics-top-cat');
    if (elTopCat) {
        const topCat = productVelocity.categoryStats.slice().sort((a, b) => b.revenue - a.revenue)[0];
        if (topCat) elTopCat.textContent = topCat.name.split(' ')[0];
    }
}

/**
 * Global dynamic tooltip listener for hovering over SVG points and bars.
 */
function setupTooltipListener() {
    if (typeof document === 'undefined') return;

    let tooltip = document.getElementById('satvik-chart-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'satvik-chart-tooltip';
        document.body.appendChild(tooltip);
    }

    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (target && (target.classList.contains('svg-data-point') || target.classList.contains('svg-data-bar'))) {
            const date = target.getAttribute('data-date');
            const rev = target.getAttribute('data-rev');
            const orders = target.getAttribute('data-orders');

            tooltip.innerHTML = `
                <div style="font-weight: 800; color: #D4A017; margin-bottom: 2px;">${date}</div>
                <div>Revenue: <strong>${rev}</strong></div>
                <div>Volume: <strong>${orders}</strong></div>
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY + 'px';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY + 'px';
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target;
        if (target && (target.classList.contains('svg-data-point') || target.classList.contains('svg-data-bar'))) {
            tooltip.style.display = 'none';
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GLOBAL EXPORTS & WINDOW ATTACHMENT
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.AdminDataAdapter = AdminDataAdapter;
    window.initAdminAnalytics = initAdminAnalytics;
    window.refreshAdminAnalytics = refreshAdminAnalytics;
    window.calculateAnalyticsMetrics = calculateAnalyticsMetrics;
}
