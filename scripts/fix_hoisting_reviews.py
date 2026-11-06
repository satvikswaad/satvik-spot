import re

with open('public/site/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract DEFAULT_SEED_FEATURED_REVIEWS block
match = re.search(r'const DEFAULT_SEED_FEATURED_REVIEWS\s*=\s*\[[\s\S]*?\n\];\n', text)
if not match:
    print('Error: DEFAULT_SEED_FEATURED_REVIEWS block not found!')
    exit(1)

seed_block = match.group(0)

# Remove it from its bottom position
text_without_seed = text[:match.start()] + text[match.end():]

# Insert it near the top, right after `let currentCatalogQuery = '';\n`
insert_target = "let currentCatalogQuery = '';\n"
idx = text_without_seed.find(insert_target)
if idx == -1:
    print('Error: insert target not found!')
    exit(1)

insert_pos = idx + len(insert_target) + 1
new_text = text_without_seed[:insert_pos] + '\n' + seed_block + '\n' + text_without_seed[insert_pos:]

with open('public/site/script.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Successfully hoisted DEFAULT_SEED_FEATURED_REVIEWS to top of script.js!')
