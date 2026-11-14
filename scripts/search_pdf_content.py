import pymupdf

doc = pymupdf.open('docs/cambridge_20_split/CAM 20 Reading - Listening (đẹp).pdf')

for i in range(len(doc)):
    txt = doc[i].get_text().lower()
    for kw in ['label the map', 'label the plan', 'label the diagram', 'map below', 'plan below', 'diagram below']:
        if kw in txt:
            print(f"Page {i+1}: contains '{kw}'")
