with open(r'u:\SatvikSwad\public\site\style.css', 'a', encoding='utf-8') as f:
    f.write("\n\n/* Hide announcement ticker per Phase 4 requirements */\n.announcement-ticker {\n  display: none !important;\n}\n")
print("Ticker hidden")
