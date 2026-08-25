import urllib.request
import re

html = urllib.request.urlopen('https://my-aii-intelligent-app.vercel.app/').read().decode('utf-8')
matches = re.findall(r'src=["\']([^"\']+\.js)["\']', html)
print("JS files:", matches)

for js in matches:
    if js.startswith('/'):
        js_url = 'https://my-aii-intelligent-app.vercel.app' + js
    else:
        js_url = 'https://my-aii-intelligent-app.vercel.app/' + js
    
    content = urllib.request.urlopen(js_url).read().decode('utf-8')
    if '127.0.0.1:8000' in content:
        print("FOUND LOCALHOST in", js)
    if 'onrender.com' in content:
        print("FOUND RENDER URL in", js)
