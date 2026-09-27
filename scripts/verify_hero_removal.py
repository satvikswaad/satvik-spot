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

    pages_to_test = [
        ("index.html", True, "verify_home_hero.png"),
        ("products.html", False, "verify_products_no_hero.png"),
        ("our-story.html", False, "verify_story_no_hero.png"),
        ("contact.html", False, "verify_contact_no_hero.png"),
        ("cancellation-refund-policy.html", False, "verify_policy_no_hero.png")
    ]

    results = []

    for page, should_have_hero, shot_name in pages_to_test:
        url = "file:///" + os.path.join(base_dir, page).replace("\\", "/")
        driver.get(url)
        time.sleep(1)

        # Check for hero banner elements
        hero_slider = driver.find_elements(By.CSS_SELECTOR, "#hero, .hero-slider-section")
        ref_hero = driver.find_elements(By.CSS_SELECTOR, ".ref-shop-hero-section, .hero-banner-section")
        banner_imgs = driver.find_elements(By.CSS_SELECTOR, "img[src*='ref-hero-banner'], img[src*='ref-story-hero-banner'], img[src*='ref-health-hero-banner']")

        has_hero_slider = len(hero_slider) > 0
        has_banner = len(ref_hero) > 0 or len(banner_imgs) > 0

        shot_path = os.path.join(artifact_dir, shot_name)
        driver.save_screenshot(shot_path)

        if should_have_hero:
            passed = has_hero_slider and not has_banner
            results.append((page, passed, f"Slider present: {has_hero_slider}, Secondary banner present: {has_banner}"))
        else:
            passed = not has_hero_slider and not has_banner
            results.append((page, passed, f"Slider present: {has_hero_slider}, Secondary banner present: {has_banner}"))

    # Also test mobile viewport for products.html
    driver.set_window_size(390, 844)
    driver.get("file:///" + os.path.join(base_dir, "products.html").replace("\\", "/"))
    time.sleep(1)
    mobile_shot = os.path.join(artifact_dir, "verify_products_mobile_no_hero.png")
    driver.save_screenshot(mobile_shot)

    driver.quit()

    print("--- VERIFICATION RESULTS ---")
    all_ok = True
    for page, passed, detail in results:
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_ok = False
        print(f"[{status}] {page}: {detail}")

    if all_ok:
        print("ALL VISUAL AUDITS PASSED!")
    else:
        print("SOME CHECKS FAILED!")

if __name__ == "__main__":
    main()
