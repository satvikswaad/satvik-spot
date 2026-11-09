import re

with open('public/site/faq.html', 'r', encoding='utf-8') as f:
    html = f.read()

chevrons = re.findall(r'<span class="chevron">.*?</span>', html, re.DOTALL)
print(f"Found {len(chevrons)} span.chevron elements in faq.html")

# Check doodle-group
dg = re.findall(r'<div class="doodle-group".*?</div>\s*</div>', html, re.DOTALL)
print(f"Found {len(dg)} doodle-group elements")

# Check heart-doodle
hd = re.findall(r'<svg[^>]*class="[^"]*heart-doodle[^"]*"[^>]*>.*?</svg>', html, re.DOTALL)
print(f"Found {len(hd)} heart-doodle elements")

# Check arrow-doodle
ad = re.findall(r'<svg[^>]*class="[^"]*arrow-doodle[^"]*"[^>]*>.*?</svg>', html, re.DOTALL)
print(f"Found {len(ad)} arrow-doodle elements")
