import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

PORT = 5000

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1280,900')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
driver = webdriver.Chrome(options=options)

try:
    driver.get(f'http://localhost:{PORT}/profile.html')
    time.sleep(2)

    # Check for console errors
    logs = driver.get_log('browser')
    err_logs = [l for l in logs if l['level'] == 'SEVERE' and 'exchangeDebugToken' not in l['message']]
    print(f"Browser SEVERE errors count: {len(err_logs)}")
    for l in err_logs:
        print("  Error:", l['message'])

    # 1. Check if "Healthy Choices Happy You" doodle or text exists
    doodles = driver.find_elements(By.CLASS_NAME, 'profile-sidebar-doodle')
    visible_doodles = [d for d in doodles if d.is_displayed()]
    print(f"Visible sidebar doodles: {len(visible_doodles)}")

    leaf_img = driver.find_elements(By.CLASS_NAME, 'profile-sidebar-doodle-img')
    visible_leaves = [l for l in leaf_img if l.is_displayed()]
    print(f"Visible sidebar leaf images: {len(visible_leaves)}")

    # 2. Check "Personal Information" card title
    card_title = driver.find_element(By.CLASS_NAME, 'profile-card-title').text
    print(f"Personal Information card title: '{card_title}' (has leaf emoji: {'🌿' in card_title})")

    # 3. Check Auth Buttons (Since user profile is logged in as Ddu)
    btn_signin = driver.find_element(By.ID, 'btn-google-signin')
    btn_signout = driver.find_element(By.ID, 'btn-google-signout')

    signin_displayed = btn_signin.is_displayed()
    signout_displayed = btn_signout.is_displayed()
    print(f"Sign In (Login) button displayed: {signin_displayed}")
    print(f"Logout button displayed: {signout_displayed}")

    # 4. Check layout gaps
    sidebar_card = driver.find_element(By.CLASS_NAME, 'profile-sidebar-card')
    card_gap = driver.execute_script("return window.getComputedStyle(arguments[0]).gap;", sidebar_card)
    card_padding = driver.execute_script("return window.getComputedStyle(arguments[0]).padding;", sidebar_card)
    main_layout = driver.find_element(By.CLASS_NAME, 'profile-main-layout')
    layout_gap = driver.execute_script("return window.getComputedStyle(arguments[0]).gap;", main_layout)
    print(f"Sidebar card gap: {card_gap}, padding: {card_padding}")
    print(f"Main layout gap: {layout_gap}")

    # 5. Capture screenshot of verified profile page
    shot_profile = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_profile_clean.png'
    driver.save_screenshot(shot_profile)
    print(f"Screenshot saved to {shot_profile}")

    # 6. Test Logout / Login interaction via JS clicks
    print("\n--- Testing Logout Click ---")
    driver.execute_script("arguments[0].click();", btn_signout)
    time.sleep(1)
    signin_after_logout = driver.execute_script("return window.getComputedStyle(arguments[0]).display !== 'none';", btn_signin)
    signout_after_logout = driver.execute_script("return window.getComputedStyle(arguments[0]).display !== 'none';", btn_signout)
    name_after_logout = driver.find_element(By.ID, 'profile-display-name').text
    print(f"After Logout: Sign In displayed: {signin_after_logout}, Logout displayed: {signout_after_logout}, Name: '{name_after_logout}'")

    print("\n--- Testing Sign In Click ---")
    driver.execute_script("arguments[0].click();", btn_signin)
    time.sleep(1)
    signin_after_login = driver.execute_script("return window.getComputedStyle(arguments[0]).display !== 'none';", btn_signin)
    signout_after_login = driver.execute_script("return window.getComputedStyle(arguments[0]).display !== 'none';", btn_signout)
    name_after_login = driver.find_element(By.ID, 'profile-display-name').text
    print(f"After Sign In: Sign In displayed: {signin_after_login}, Logout displayed: {signout_after_login}, Name: '{name_after_login}'")

    shot_restored = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_profile_logged_in.png'
    driver.save_screenshot(shot_restored)
    print(f"Restored logged-in screenshot saved to {shot_restored}")

finally:
    driver.quit()
