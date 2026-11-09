import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/site/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Find all rules related to faq, polaroid, doodle, script-title
rules = re.findall(r'([^{}]*(?:faq|polaroid|doodle|script-title)[^{}]*\{[^}]*\})', css, re.IGNORECASE)
print(f'Found {len(rules)} CSS rules.')
for r in rules:
    print(r.strip())
    print('-'*40)
