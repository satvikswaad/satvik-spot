import re, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('public/site/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

classes = set(re.findall(r'class=["\']([^"\']+)["\']', html))
all_classes = set()
for c in classes:
    for word in c.split():
        all_classes.add(word)

keywords = ['leaf', 'leaves', 'foliage', 'botanical', 'twig', 'vine', 'branch', 'plant', 'nature', 'sprout', 'spray']
for c in sorted(all_classes):
    low = c.lower()
    if any(k in low for k in keywords):
        print('Matched class in index.html:', c)

# Check for emoji 🌿, 🍃, 🌱
emojis = [('🌿', 'herb'), ('🍃', 'leaves_wind'), ('🌱', 'seedling')]
for e, name in emojis:
    count = html.count(e)
    if count:
        print(f'Emoji {name} count in index.html: {count}')

# Check style.css as well
with open('public/site/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

for k in keywords:
    matches = re.findall(r'[^{}]*' + k + r'[^{}]*\{[^}]*\}', css, re.IGNORECASE)
    if matches:
        print(f'CSS rules matching "{k}": {len(matches)}')
        for m in matches[:3]:
            print('   ', m.strip()[:100])
