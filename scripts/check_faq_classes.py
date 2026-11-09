import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/site/faq.html', 'r', encoding='utf-8') as f:
    html = f.read()

classes = set(re.findall(r'class=["\']([^"\']+)["\']', html))
all_words = set()
for c in classes:
    for w in c.split():
        all_words.add(w)

keywords = ['doodle', 'script', 'brush', 'caveat', 'heart', 'arrow', 'chevron']
for w in sorted(all_words):
    if any(k in w.lower() for k in keywords):
        print('Matched word in faq.html class:', w)
