import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# Remove onerror
html = re.sub(r'<script>\s*window\.onerror.*?<\/script>\s*', '', html, flags=re.DOTALL)
# Revert inline JS
html = re.sub(r'<script>\s*// ===== NEO DEFENDER.*?<\/script>', '<script src="game.js"></script>', html, flags=re.DOTALL)

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
