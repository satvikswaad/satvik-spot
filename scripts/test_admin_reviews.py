import http.server
import socketserver
import threading
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import os

PORT = 8093
DIRECTORY = os.path.abspath('.')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass # suppress logs

httpd = socketserver.TCPServer(("", PORT), Handler)
server_thread = threading.Thread(target=httpd.serve_forever)
server_thread.daemon = True
server_thread.start()
print(f"HTTP Server started at http://localhost:{PORT}")

try:
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1280,900')

    driver = webdriver.Chrome(options=options)
    url = f"http://localhost:{PORT}/public/admin/index.html"
    driver.get(url)
    time.sleep(1)

    # Dev quick access login button click
    btn_dev = driver.find_element(By.ID, 'btn-dev-quick-login')
    btn_dev.click()
    time.sleep(2)

    # Click reviews nav
    rev_nav = driver.find_element(By.ID, 'btn-nav-reviews')
    driver.execute_script("arguments[0].click();", rev_nav)
    time.sleep(2)

    shot_admin = r'C:\Users\tripu\.gemini\antigravity\brain\b2f887c5-a56c-4992-9213-f6b10fd8262d\verified_admin_reviews_view.png'
    driver.save_screenshot(shot_admin)
    print(f'Admin reviews view screenshot saved to {shot_admin}')

    cards = driver.find_elements(By.CLASS_NAME, 'rev-admin-card')
    toggles = driver.find_elements(By.CLASS_NAME, 'rev-toggle-btn')
    print(f'Admin review cards rendered: {len(cards)}, Toggle buttons: {len(toggles)}')

    if toggles:
        was_active = "active" in toggles[0].get_attribute("class")
        print(f'First review toggle initially active: {was_active}')
        
        driver.execute_script("arguments[0].click();", toggles[0])
        time.sleep(1)
        
        new_toggles = driver.find_elements(By.CLASS_NAME, 'rev-toggle-btn')
        is_active_now = "active" in new_toggles[0].get_attribute("class")
        print(f'First review toggle after click active: {is_active_now}')
        print('Toggle successfully flipped state:', was_active != is_active_now)

finally:
    driver.quit()
    httpd.shutdown()
    print("Server stopped.")
