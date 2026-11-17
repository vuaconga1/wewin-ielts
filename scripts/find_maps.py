with open(r"docs\cambridge_12_split\Cambridge_12_All_OCR.txt", encoding="utf-8") as f:
    text = f.read()

pages = text.split("===== PAGE ")
for p in pages:
    if not p.strip():
        continue
    lines = p.strip().split("\n")
    header = lines[0]
    p_text = "\n".join(lines[1:]).lower()
    for kw in ["label the map", "label the plan", "label the diagram", "map below", "plan below", "diagram below"]:
        if kw in p_text:
            print(f"{header}: contains '{kw}'")
