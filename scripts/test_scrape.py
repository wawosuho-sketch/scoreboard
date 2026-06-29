import requests
from bs4 import BeautifulSoup

url = "https://boram.sjeduhs.kr/boram-h/main.do"
try:
    response = requests.get(url, timeout=10, verify=False)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Check common logo elements in typical Korean school templates (e.g. h1.logo img)
    h1 = soup.find('h1')
    if h1:
         img = h1.find('img')
         if img:
             print("Found logo:", img.get('src'))
    
    with open('boram2.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
        
except Exception as e:
    print("Error:", e)
