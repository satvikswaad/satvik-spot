import re

filepath = r'u:\SatvikSwad\public\site\contact.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add phone field to contact.html
phone_field = """
                        <label class="form-field" style="margin-top: 20px;">
                            <span class="field-label">Phone <span class="required">*</span></span>
                            <input type="tel" id="contact-phone" name="phone" class="ss-input" required placeholder="Your phone number" />
                        </label>
"""
content = content.replace(
    '</label>\n                        </div>',
    '</label>\n                        </div>' + phone_field
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added contact-phone to contact.html")
