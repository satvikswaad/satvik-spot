import http.server, socketserver, threading, time, os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

PORT = 8098
DIRECTORY = os.path.abspath('.')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

httpd = socketserver.TCPServer(('', PORT), Handler)
t = threading.Thread(target=httpd.serve_forever)
t.daemon = True
t.start()
print(f"HTTP Server started on port {PORT}")

try:
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1280,900')
    driver = webdriver.Chrome(options=options)
    driver.get(f'http://localhost:{PORT}/public/site/index.html')
    time.sleep(2)

    # 1. TEST MARQUEE SLIDING
    track = driver.find_element(By.ID, 'ratings-marquee-track')
    
    # Scroll to reviews section so it is in viewport
    driver.execute_script("document.getElementById('customer-ratings-section').scrollIntoView();")
    time.sleep(1)

    shot_reviews_1 = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_ratings_sliding_t0.png'
    driver.save_screenshot(shot_reviews_1)

    t0_pos = driver.execute_script("""
        const rect = arguments[0].getBoundingClientRect();
        const style = window.getComputedStyle(arguments[0]);
        return {
            left: rect.left,
            transform: style.transform,
            anim: style.animationName,
            playState: style.animationPlayState
        };
    """, track)
    print("Marquee state at T=0:", t0_pos)

    # Wait 2.5 seconds to measure movement
    time.sleep(2.5)

    shot_reviews_2 = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_ratings_sliding_t2.png'
    driver.save_screenshot(shot_reviews_2)

    t2_pos = driver.execute_script("""
        const rect = arguments[0].getBoundingClientRect();
        const style = window.getComputedStyle(arguments[0]);
        return {
            left: rect.left,
            transform: style.transform,
            anim: style.animationName,
            playState: style.animationPlayState
        };
    """, track)
    print("Marquee state at T=2.5s:", t2_pos)

    moved = (t0_pos['left'] != t2_pos['left']) or (t0_pos['transform'] != t2_pos['transform'])
    print(f"MARQUEE IS SLIDING: {moved}")
    if moved:
        dx = t2_pos['left'] - t0_pos['left']
        print(f"Displacement over 2.5s: {dx:.2f}px (direction: {'Left-to-Right (positive)' if dx > 0 else 'Right-to-Left'})")

    # 2. TEST CATALOG SECTION (CHECKING FOR VINE LEAVES FROM USER'S SCREENSHOT)
    driver.execute_script("document.getElementById('catalog').scrollIntoView();")
    time.sleep(1)

    shot_catalog_clean = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_catalog_no_leaves.png'
    driver.save_screenshot(shot_catalog_clean)
    print(f"Saved catalog screenshot to {shot_catalog_clean}")

    # Inspect page for any leaf / botanical elements
    leaf_elements = driver.execute_script("""
        const selectors = [
            '.catalog-corner-foliage',
            '.card-botanical-twig',
            '.foliage-tl',
            '.foliage-tr',
            '.foliage-bl',
            '.ref-story-leaf',
            '.hp-corner-leaves-wrap',
            '.cat-leaf-icon',
            '.pillar-leaf-bg',
            '.hero-corner-leaf'
        ];
        let found = [];
        for (let sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (let el of els) {
                if (window.getComputedStyle(el).display !== 'none') {
                    found.push(sel);
                }
            }
        }
        return found;
    """)
    print("Visible leaf elements in DOM:", leaf_elements)

finally:
    driver.quit()
    httpd.shutdown()
    print("Test finished and server stopped.")
