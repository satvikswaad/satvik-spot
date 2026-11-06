import http.server, socketserver, threading, time, os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

PORT = 8097
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

try:
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--window-size=1280,900')
    driver = webdriver.Chrome(options=options)
    driver.get(f'http://localhost:{PORT}/public/site/index.html')
    time.sleep(2)
    
    track = driver.find_element(By.ID, 'ratings-marquee-track')
    reduced = driver.execute_script("return window.matchMedia('(prefers-reduced-motion: reduce)').matches;")
    comp_anim = driver.execute_script("return window.getComputedStyle(arguments[0]).animation;", track)
    comp_anim_name = driver.execute_script("return window.getComputedStyle(arguments[0]).animationName;", track)
    print("Reduced motion matches:", reduced)
    print("Computed animation:", comp_anim)
    print("Computed animationName:", comp_anim_name)
    
    # Check keyframe rule in document stylesheets
    kf_found = driver.execute_script("""
    for (let s of document.styleSheets) {
        try {
            for (let r of s.cssRules) {
                if (r.type === CSSRule.KEYFRAMES_RULE && r.name === 'marqueeLeftToRight') {
                    return r.cssText;
                }
            }
        } catch(e){}
    }
    return 'NOT FOUND';
    """)
    print("Keyframes marqueeLeftToRight rule:", kf_found)
    
finally:
    driver.quit()
    httpd.shutdown()
