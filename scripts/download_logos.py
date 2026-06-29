import json
import os
import requests
from bs4 import BeautifulSoup
import re
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

with open('schools.json', 'r', encoding='utf-8') as f:
    schools = json.load(f)

save_dir = r"c:\Users\wawos\Documents\농구\scoreboard\public\logos"
os.makedirs(save_dir, exist_ok=True)

success_count = 0

for s in schools:
    school_name = s['school']
    base_url = s['url']
    if not base_url or base_url == "#":
        continue
    
    file_path = os.path.join(save_dir, f"{school_name}.png")
    if os.path.exists(file_path):
        success_count += 1
        continue
        
    try:
        if base_url.startswith("http://"):
            base_url = base_url.replace("http://", "https://")
            
        print(f"Processing {school_name} -> {base_url}")
        res1 = requests.get(base_url, timeout=5, verify=False)
        
        # Find redirect
        match = re.search(r'location\.href\s*=\s*["\']([^"\']+)["\']', res1.text)
        if match:
            redirect_url = match.group(1)
            if redirect_url.startswith('/'):
                from urllib.parse import urlparse
                parsed = urlparse(base_url)
                main_url = f"{parsed.scheme}://{parsed.netloc}{redirect_url}"
            elif not redirect_url.startswith('http'):
                main_url = f"{base_url.rstrip('/')}/{redirect_url.lstrip('/')}"
            else:
                main_url = redirect_url
        else:
            main_url = base_url
            
        # Get main page
        res2 = requests.get(main_url, timeout=5, verify=False)
        soup = BeautifulSoup(res2.content, 'html.parser')
        
        img_src = None
        # Try h1 img (Standard Sejong Template)
        h1 = soup.find('h1')
        if h1:
            img = h1.find('img')
            if img:
                img_src = img.get('src')
        
        # Fallback to header logo
        if not img_src:
            header = soup.find('header')
            if header:
                imgs = header.find_all('img')
                for img in imgs:
                    src = img.get('src', '').lower()
                    alt = img.get('alt', '').lower()
                    if 'logo' in src or '로고' in alt or '교표' in alt or '마크' in alt:
                        img_src = img.get('src')
                        break

        if img_src:
            if img_src.startswith('/'):
                from urllib.parse import urlparse
                parsed = urlparse(main_url)
                img_url = f"{parsed.scheme}://{parsed.netloc}{img_src}"
            elif not img_src.startswith('http'):
                img_url = f"{main_url.rstrip('/')}/{img_src.lstrip('/')}"
            else:
                img_url = img_src
                
            img_res = requests.get(img_url, timeout=5, verify=False)
            if img_res.status_code == 200:
                with open(file_path, 'wb') as f:
                    f.write(img_res.content)
                print(f" => Saved logo for {school_name}")
                success_count += 1
            else:
                print(f" => Failed to download image from {img_url}")
        else:
            print(" => Logo not found in HTML")
            
    except Exception as e:
        print(f" => Error processing {school_name}: {e}")

print(f"Done. Successfully downloaded {success_count} logos.")
