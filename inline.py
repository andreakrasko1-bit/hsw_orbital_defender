import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

with codecs.open('game.js', 'r', 'utf-8') as f:
    js = f.read()

html = html.replace('<script src="game.js"></script>', '<script>\n' + js + '\n</script>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
