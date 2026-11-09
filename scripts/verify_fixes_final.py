import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

PORT = 5000

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1280,900')
driver = webdriver.Chrome(options=options)

try:
    # ----------------------------------------------------
    # TEST 1: REVIEWS MARQUEE HOVER PAUSE
    # ----------------------------------------------------
    driver.get(f'http://localhost:{PORT}/index.html')
    time.sleep(2)

    # Scroll to reviews section
    rev_section = driver.find_element(By.ID, 'customer-ratings-section')
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", rev_section)
    time.sleep(1)

    track = driver.find_element(By.ID, 'ratings-marquee-track')

    # Initial state (running)
    initial_state = driver.execute_script("""
        const t = arguments[0];
        const s = window.getComputedStyle(t);
        return {
            playState: s.animationPlayState,
            transform: s.transform
        };
    """, track)
    print("Initial marquee state:", initial_state)

    # Hover mouse over the section container
    actions = ActionChains(driver)
    actions.move_to_element(rev_section).perform()
    time.sleep(1)

    hover_state_1 = driver.execute_script("""
        const t = arguments[0];
        const s = window.getComputedStyle(t);
        return {
            playState: s.animationPlayState,
            transform: s.transform
        };
    """, track)
    print("State during hover T=1s:", hover_state_1)

    time.sleep(2)
    hover_state_2 = driver.execute_script("""
        const t = arguments[0];
        const s = window.getComputedStyle(t);
        return {
            playState: s.animationPlayState,
            transform: s.transform
        };
    """, track)
    print("State during hover T=3s:", hover_state_2)

    is_stopped = (hover_state_1['transform'] == hover_state_2['transform']) or (hover_state_1['playState'] == 'paused')
    print(f"MARQUEE STOPPED ON HOVER: {is_stopped}")

    shot_hover = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_reviews_hover_paused.png'
    driver.save_screenshot(shot_hover)
    print(f"Screenshot saved to {shot_hover}")

    # Move mouse to footer
    footer = driver.find_element(By.TAG_NAME, 'footer')
    actions.move_to_element(footer).perform()
    time.sleep(2)
    resume_state = driver.execute_script("""
        const t = arguments[0];
        const s = window.getComputedStyle(t);
        return {
            playState: s.animationPlayState,
            transform: s.transform
        };
    """, track)
    print("State after mouse move to footer:", resume_state)
    has_resumed = (resume_state['playState'] == 'running') or (resume_state['transform'] != hover_state_2['transform'])
    print(f"MARQUEE RESUMED AFTER LEAVE: {has_resumed}")

    # ----------------------------------------------------
    # TEST 2: FAQS PAGE TYPOGRAPHY & ARROW/HEART CLEANUP
    # ----------------------------------------------------
    driver.get(f'http://localhost:{PORT}/faq.html')
    time.sleep(2)

    # Check question font
    first_summary = driver.find_element(By.CLASS_NAME, 'faq-summary')
    font_family = driver.execute_script("return window.getComputedStyle(arguments[0]).fontFamily;", first_summary)
    font_weight = driver.execute_script("return window.getComputedStyle(arguments[0]).fontWeight;", first_summary)
    font_size = driver.execute_script("return window.getComputedStyle(arguments[0]).fontSize;", first_summary)
    print("FAQ question font-family:", font_family)
    print("FAQ question font-weight:", font_weight)
    print("FAQ question font-size:", font_size)

    # Check title font
    title = driver.find_element(By.CSS_SELECTOR, '.script-title')
    title_font = driver.execute_script("return window.getComputedStyle(arguments[0]).fontFamily;", title)
    print("FAQ title font-family:", title_font)

    # Check remaining arrows in summary
    mid_arrows = driver.find_elements(By.CSS_SELECTOR, '.faq-summary .chevron')
    visible_mid_arrows = [a for a in mid_arrows if a.is_displayed()]
    print(f"Visible mid arrows in questions: {len(visible_mid_arrows)}")

    # Check hearts and arrow doodles
    hearts = driver.find_elements(By.CSS_SELECTOR, '.heart-doodle')
    visible_hearts = [h for h in hearts if h.is_displayed()]
    arrow_doodles = driver.find_elements(By.CSS_SELECTOR, '.arrow-doodle')
    visible_arrow_doodles = [a for a in arrow_doodles if a.is_displayed()]
    print(f"Visible hearts on FAQ page: {len(visible_hearts)}")
    print(f"Visible arrow doodles on FAQ page: {len(visible_arrow_doodles)}")

    shot_faq = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_faq_clean_fonts.png'
    driver.save_screenshot(shot_faq)
    print(f"Screenshot saved to {shot_faq}")

finally:
    driver.quit()
