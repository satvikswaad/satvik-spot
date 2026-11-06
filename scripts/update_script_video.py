with open('public/site/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add import
if 'import { BUSINESS_CONFIG }' not in text:
    text = "import { BUSINESS_CONFIG } from './js/businessConfig.js';\n" + text

# 2. Add safeRun call
target_run = "safeRun(initCustomerRatingsMarquee, 'initCustomerRatingsMarquee');"
replacement_run = "safeRun(initCustomerRatingsMarquee, 'initCustomerRatingsMarquee');\n    safeRun(initSatvikStoryVideoPlayer, 'initSatvikStoryVideoPlayer');"
if target_run in text and 'initSatvikStoryVideoPlayer' not in text:
    text = text.replace(target_run, replacement_run, 1)

# 3. Add function implementation
fn_code = '''
function initSatvikStoryVideoPlayer() {
    const playBtn = document.getElementById('btn-play-story-video');
    const poster = document.getElementById('satvik-video-poster');
    const container = document.getElementById('why-choose-video-container');
    if (!container) return;

    function handlePlayVideo(e) {
        if (e) e.preventDefault();

        let ytId = container.getAttribute('data-youtube-id') || '';
        if (!ytId && typeof BUSINESS_CONFIG !== 'undefined' && BUSINESS_CONFIG.youtubeVideoId) {
            ytId = BUSINESS_CONFIG.youtubeVideoId;
        }

        if (ytId && ytId.trim()) {
            container.innerHTML = `
                <iframe
                    class="why-choose-iframe"
                    src="https://www.youtube.com/embed/${encodeURIComponent(ytId.trim())}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
                    title="Satvik Swaad Kitchen Story"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen>
                </iframe>
            `;
        } else {
            showSatvikStoryModal();
        }
    }

    if (playBtn) playBtn.addEventListener('click', handlePlayVideo);
    if (poster) poster.addEventListener('click', (e) => {
        if (!e.target.closest('#btn-play-story-video')) {
            handlePlayVideo(e);
        }
    });
}

function showSatvikStoryModal() {
    let existing = document.getElementById('satvik-story-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'satvik-story-modal';
    modal.className = 'suite-modal-backdrop active';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(20,15,10,0.75);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    
    modal.innerHTML = `
        <div style="background:#FAF7F2;border:2px solid #8C3A27;border-radius:20px;max-width:540px;width:100%;padding:28px;box-shadow:0 25px 60px rgba(0,0,0,0.3);position:relative;text-align:center;">
            <button type="button" id="btn-close-story-modal" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:24px;color:#8C3A27;cursor:pointer;font-weight:700;">✕</button>
            <div style="width:60px;height:60px;margin:0 auto 14px;border-radius:50%;overflow:hidden;border:2px solid #D4A017;">
                <img src="assets/satvik_logo_round.png" alt="Satvik Swaad" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <h3 style="font-family:'Playfair Display',serif;color:#7A1C1C;font-size:1.6rem;margin-bottom:8px;">Satvik Swaad Kitchen Story</h3>
            <p style="color:#5C5248;font-size:0.95rem;line-height:1.6;margin-bottom:16px;">
                Every batch of our pickles, murabbas, and artisanal sweets is prepared in small family kitchens by local mothers using pure cold-pressed mustard oil and sun-cured in traditional earthen barnis.
            </p>
            <div style="background:#FFFFFF;border:1px dashed #D4A017;border-radius:12px;padding:12px;margin-bottom:20px;">
                <p style="font-size:0.85rem;color:#8C3A27;font-weight:600;margin:0;">
                    💡 YouTube video setup: Add your official YouTube video ID in <code>public/site/js/businessConfig.js</code> (or in admin settings) to play your video directly here without server load!
                </p>
            </div>
            <button type="button" id="btn-ok-story-modal" style="background:linear-gradient(135deg,#7A1C1C,#541212);color:#FFFFFF;border:none;border-radius:10px;padding:10px 24px;font-weight:700;cursor:pointer;font-size:0.95rem;">
                Understood
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    function closeModal() {
        modal.remove();
    }

    modal.querySelector('#btn-close-story-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-ok-story-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}
'''

if 'function initSatvikStoryVideoPlayer' not in text:
    text += '\n' + fn_code

with open('public/site/script.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('script.js updated successfully!')
