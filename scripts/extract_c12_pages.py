import os
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "docs", "cambridge_12", "Cambridge IELTS 12", "Cambridge IELTS 12 PDF.pdf")
PAGES_DIR = os.path.join(ROOT, "docs", "cambridge_12_split", "pages")
TEXT_DIR = os.path.join(ROOT, "docs", "cambridge_12_split", "text")

os.makedirs(PAGES_DIR, exist_ok=True)
os.makedirs(TEXT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
print(f"Extracting {len(doc)} pages to PNG and text...")

for idx in range(len(doc)):
    page_num = idx + 1
    page = doc[idx]
    
    # Render PNG
    png_path = os.path.join(PAGES_DIR, f"page_{page_num:03d}.png")
    if not os.path.exists(png_path):
        pix = page.get_pixmap(dpi=150)
        pix.save(png_path)
    
    # Save direct text if present
    txt = page.get_text()
    txt_path = os.path.join(TEXT_DIR, f"page_{page_num:03d}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(txt)

print("All pages rendered to PNG and initial text extracted.")
