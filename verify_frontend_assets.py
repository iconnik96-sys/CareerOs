import requests
import re

res = requests.get('http://localhost:3000')
print(f"HTML response: {res.status_code}, Length: {len(res.text)}")
scripts = re.findall(r'src=["\']([^"\']+)["\']', res.text)
links = re.findall(r'href=["\']([^"\']+\.css)["\']', res.text)

print("\n--- Verifying Scripts ---")
for s in scripts:
    url = f"http://localhost:3000{s}" if s.startswith('/') else f"http://localhost:3000/{s}"
    s_res = requests.get(url)
    print(f"{s}: HTTP {s_res.status_code} ({len(s_res.content)} bytes)")
    assert s_res.status_code == 200

print("\n--- Verifying CSS Stylesheets ---")
for css in links:
    url = f"http://localhost:3000{css}" if css.startswith('/') else f"http://localhost:3000/{css}"
    c_res = requests.get(url)
    print(f"{css}: HTTP {c_res.status_code} ({len(c_res.content)} bytes)")
    assert c_res.status_code == 200

print("\nAll frontend assets verified successfully on Nginx production container!")
