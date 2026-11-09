import sys
import time
import json
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ARTIFACTS_DIR = r"C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d"

def run_test():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1440,900")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    print("Launching headless Chrome...", flush=True)
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        print("=== STEP 1: TEST STOREFRONT FOOTER NEWSLETTER SUBSCRIPTION ===", flush=True)
        driver.get("http://localhost:5000/")
        time.sleep(1)

        # Scroll to footer newsletter card
        newsletter_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".footer-newsletter-input")))
        driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", newsletter_input)
        time.sleep(0.5)

        test_email = f"festive_diwali_{int(time.time())}@satvikswaad.com"
        print(f"Subscribing with test email: {test_email}", flush=True)

        newsletter_input.clear()
        newsletter_input.send_keys(test_email)

        subscribe_btn = driver.find_element(By.CSS_SELECTOR, ".footer-newsletter-btn")
        driver.execute_script("arguments[0].click();", subscribe_btn)
        time.sleep(1)

        # Check toast
        toast = driver.find_element(By.ID, "toast")
        toast_text = toast.text
        print(f"Storefront Toast Message: '{toast_text}'", flush=True)
        assert "Dhanyawad" in toast_text, f"Unexpected toast text: {toast_text}"

        # Check localStorage on storefront
        stored_raw = driver.execute_script("return localStorage.getItem('satvik_newsletter_subscribers');")
        stored_subs = json.loads(stored_raw) if stored_raw else []
        print(f"Storefront localStorage subscribers count: {len(stored_subs)}", flush=True)
        assert any(s['email'] == test_email for s in stored_subs), f"{test_email} not found in stored subscribers"
        print("PASS: Email persisted in storefront storage successfully!", flush=True)

        # Test duplicate prevention
        newsletter_input.clear()
        newsletter_input.send_keys(test_email)
        driver.execute_script("arguments[0].click();", subscribe_btn)
        time.sleep(1)
        toast_dup = toast.text
        print(f"Duplicate Subscribe Toast Message: '{toast_dup}'", flush=True)
        assert "already subscribed" in toast_dup, f"Expected already subscribed toast, got: {toast_dup}"
        print("PASS: Duplicate check functioning properly!", flush=True)

        print("\n=== STEP 2: TEST ADMIN SUITE SUBSCRIBERS VIEW & 1-CLICK COPY ===", flush=True)
        driver.get("http://localhost:5001/")
        time.sleep(1.5)

        # Auto-login via Dev Quick Login button
        auth_container = driver.find_element(By.ID, "auth-container")
        if auth_container.is_displayed():
            print("Accessing Admin Portal via Dev Direct Access...", flush=True)
            btn_dev = wait.until(EC.element_to_be_clickable((By.ID, "btn-dev-quick-login")))
            driver.execute_script("arguments[0].click();", btn_dev)
            time.sleep(1.5)

        portal_container = wait.until(EC.visibility_of_element_located((By.ID, "portal-container")))
        print("PASS: Logged into Admin Suite successfully!", flush=True)

        # Check navigation button
        nav_subscribers = wait.until(EC.presence_of_element_located((By.ID, "btn-nav-subscribers")))
        badge_count = driver.find_element(By.ID, "badge-subscribers-count").text
        print(f"Nav Subscribers Button found! Badge count: {badge_count}", flush=True)

        # Navigate to subscribers view
        driver.execute_script("arguments[0].click();", nav_subscribers)
        time.sleep(2.5)

        view_subscribers = driver.find_element(By.ID, "view-subscribers")
        assert "active" in view_subscribers.get_attribute("class"), "view-subscribers is not active"
        print("PASS: Switched to view-subscribers view!", flush=True)

        # Check KPI values
        stat_total = driver.find_element(By.ID, "stat-total-subscribers").text
        stat_active = driver.find_element(By.ID, "stat-active-subscribers").text
        stat_month = driver.find_element(By.ID, "stat-month-subscribers").text
        print(f"KPIs -> Total: {stat_total}, Active: {stat_active}, This Month: {stat_month}", flush=True)

        # Check table content
        table_body = driver.find_element(By.ID, "subscribers-table-body")
        table_html = table_body.get_attribute("innerHTML")
        assert test_email in table_html, f"Expected {test_email} in subscribers table"
        print(f"PASS: Verified {test_email} appears live in the subscribers table!", flush=True)

        # Check Quick Campaign Clipboard Preview
        preview_box = driver.find_element(By.ID, "subscribers-clipboard-preview")
        preview_text = preview_box.get_attribute("value")
        print(f"Clipboard Preview (first 100 chars): {preview_text[:100]}...", flush=True)
        assert test_email in preview_text, "Test email not in clipboard preview"

        # Click Copy All Emails
        btn_copy_all = driver.find_element(By.ID, "btn-copy-all-subscribers")
        driver.execute_script("arguments[0].click();", btn_copy_all)
        time.sleep(0.8)

        # Verify toast notification in admin
        admin_toasts = driver.find_elements(By.CSS_SELECTOR, "#admin-toast-container .admin-toast")
        if admin_toasts:
            print(f"Admin Toast Message: '{admin_toasts[-1].text}'", flush=True)

        # Test Format Switching
        btn_newline = driver.find_element(By.ID, "btn-format-newline")
        driver.execute_script("arguments[0].click();", btn_newline)
        time.sleep(0.5)
        newline_preview = preview_box.get_attribute("value")
        assert "\n" in newline_preview, "Newline format did not take effect"
        print("PASS: Switched format to One Per Line successfully!", flush=True)

        btn_comma = driver.find_element(By.ID, "btn-format-comma")
        driver.execute_script("arguments[0].click();", btn_comma)
        time.sleep(0.5)

        # Test Search Filter
        search_input = driver.find_element(By.ID, "input-search-subscribers")
        search_input.clear()
        search_input.send_keys("diwali")
        driver.execute_script("arguments[0].dispatchEvent(new Event('input'));", search_input)
        time.sleep(0.5)
        filtered_rows = table_body.find_elements(By.TAG_NAME, "tr")
        print(f"Rows after searching 'diwali': {len(filtered_rows)}", flush=True)
        assert len(filtered_rows) == 1, f"Expected 1 filtered row, got {len(filtered_rows)}"

        # Clear search
        search_input.clear()
        driver.execute_script("arguments[0].value = ''; arguments[0].dispatchEvent(new Event('input'));", search_input)
        time.sleep(0.5)

        # Take screenshot of the Admin Subscribers View
        screenshot_path = os.path.join(ARTIFACTS_DIR, "verified_admin_subscribers_view.png")
        driver.save_screenshot(screenshot_path)
        print(f"PASS: Screenshot captured at {screenshot_path}", flush=True)

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===", flush=True)

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
