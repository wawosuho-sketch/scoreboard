import pandas as pd
import json

file_path = r"c:\Users\wawos\Documents\농구\학교현황조회_20260629235959.xlsx"
df = pd.read_excel(file_path)

# Columns might be: 순번, 지역, 학교급, 학교명, 설립유형, 학교전화번호, 학교팩스번호, 주소, 홈페이지주소 (from common 학교알리미 format)
# We just need columns containing '학교명' and '홈페이지'
school_col = [c for c in df.columns if '학교' in c and '명' in c]
url_col = [c for c in df.columns if '홈페이지' in c or '주소' in c][-1]

if school_col:
    school_col = school_col[0]
else:
    school_col = df.columns[3] # Fallback

if url_col:
    pass
else:
    url_col = df.columns[-1] # Fallback

data = []
for index, row in df.iterrows():
    data.append({
        "school": str(row[school_col]),
        "url": str(row[url_col])
    })

with open('schools.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
