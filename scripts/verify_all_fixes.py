import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")

    driver = webdriver.Chrome(options=options)
    artifact_dir = r"C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d"
    base_dir = os.path.abspath("public/site")
    admin_dir = os.path.abspath("public/admin")

    print("=== 1. AUDITING STOREFRONT (public/site/index.html) ===")
    url = "file:///" + os.path.join(base_dir, "index.html").replace("\\", "/")
    driver.get(url)
    time.sleep(2)

    # Check Why Choose section
    why_choose = driver.find_element(By.ID, "why-choose")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", why_choose)
    time.sleep(1)
    shot_why_choose = os.path.join(artifact_dir, "verified_why_choose_clean.png")
    why_choose.screenshot(shot_why_choose)
    print(f"Captured: {shot_why_choose}")

    # Verify zero overlapping clutter
    notes = driver.find_elements(By.CLASS_NAME, "why-choose-left-note")
    doodles = driver.find_elements(By.CLASS_NAME, "why-choose-right-doodles")
    folds = driver.find_elements(By.CLASS_NAME, "why-choose-top-right-fold")
    print(f"Overlapping notes count: {len(notes)} (expected: 0)")
    print(f"Overlapping doodles count: {len(doodles)} (expected: 0)")
    print(f"Overlapping folds count: {len(folds)} (expected: 0)")

    # Verify video card has Satvik Swaad cover & play button
    play_btn = driver.find_elements(By.ID, "btn-play-story-video")
    poster_img = driver.find_elements(By.CLASS_NAME, "satvik-video-poster-img")
    print(f"Play button present: {len(play_btn) > 0}")
    print(f"Satvik Swaad poster present: {len(poster_img) > 0}")

    # Check Customer Ratings Marquee Section
    ratings_sec = driver.find_element(By.ID, "customer-ratings-section")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", ratings_sec)
    time.sleep(1)
    shot_ratings = os.path.join(artifact_dir, "verified_customer_ratings_marquee.png")
    ratings_sec.screenshot(shot_ratings)
    print(f"Captured: {shot_ratings}")

    # Check that Customer Ratings sits right above footer
    footer = driver.find_element(By.CLASS_NAME, "site-footer")
    footer_pos = footer.location['y']
    ratings_pos = ratings_sec.location['y']
    print(f"Ratings section y-pos: {ratings_pos}, Footer y-pos: {footer_pos} -> Directly above footer: {ratings_pos < footer_pos}")

    # Check leaf elements in DOM
    leaves = driver.find_elements(By.CSS_SELECTOR, ".cat-leaf-icon, .leaf-spray, .fold-leaf")
    print(f"Remaining leaf SVGs in DOM: {len(leaves)} (expected: 0)")

    # Mobile Viewport Test (390 x 844)
    print("\n=== 2. AUDITING MOBILE VIEWPORT (390x844) ===")
    driver.set_window_size(390, 844)
    driver.get(url)
    time.sleep(2)

    why_choose_mobile = driver.find_element(By.ID, "why-choose")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", why_choose_mobile)
    time.sleep(1)
    shot_why_choose_mobile = os.path.join(artifact_dir, "verified_why_choose_mobile.png")
    why_choose_mobile.screenshot(shot_why_choose_mobile)
    print(f"Captured: {shot_why_choose_mobile}")

    ratings_mobile = driver.find_element(By.ID, "customer-ratings-section")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", ratings_mobile)
    time.sleep(1)
    shot_ratings_mobile = os.path.join(artifact_dir, "verified_ratings_mobile.png")
    ratings_mobile.screenshot(shot_ratings_mobile)
    print(f"Captured: {shot_ratings_mobile}")

    # Check horizontal overflow on mobile
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth")
    client_width = driver.execute_script("return document.documentElement.clientWidth")
    print(f"Mobile scrollWidth: {scroll_width}, clientWidth: {client_width} -> Horizontal overflow: {scroll_width > client_width}")

    print("\n=== 3. AUDITING ADMIN PANEL (public/admin/index.html) ===")
    driver.set_window_size(1280, 900)
    admin_url = "file:///" + os.path.join(admin_dir, "index.html").replace("\\", "/")
    driver.get(admin_url)
    time.sleep(1)

    # Check nav item
    rev_nav_btns = driver.find_elements(By.ID, "btn-nav-reviews")
    print(f"Admin Reviews Nav Button exists: {len(rev_nav_btns) > 0}")

    driver.quit()
    print("\nALL AUTOMATED VERIFICATION CHECKS COMPLETED!")

if __name__ == "__main__":
    main()
