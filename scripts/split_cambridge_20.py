import os
import shutil
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "docs", "cambridge_20_split", "CAM 20 Reading - Listening (đẹp).pdf")
SPLIT_DIR = os.path.join(ROOT, "docs", "cambridge_20_split")
FIXED_DIR = os.path.join(SPLIT_DIR, "fixed_40_pages")
os.makedirs(FIXED_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
total_pages = len(doc)
print(f"Total pages in original PDF: {total_pages}")

# 1. Split fixed 40 pages
fixed_splits = [
    ("Cambridge_20_Part1_Trang_001-040.pdf", 0, 40),
    ("Cambridge_20_Part2_Trang_041-080.pdf", 40, 80),
]

for filename, start, end in fixed_splits:
    out_pdf = pymupdf.open()
    out_pdf.insert_pdf(doc, from_page=start, to_page=end - 1)
    out_path = os.path.join(FIXED_DIR, filename)
    out_pdf.save(out_path)
    out_pdf.close()
    print(f"Created fixed split: {out_path} ({end - start} pages)")

# 2. Split logical tests
test_splits = [
    ("Cambridge_20_Part1_Trang_001-022_Test1", 0, 22),
    ("Cambridge_20_Part2_Trang_023-043_Test2", 22, 43),
    ("Cambridge_20_Part3_Trang_044-062_Test3", 43, 62),
    ("Cambridge_20_Part4_Trang_063-080_Test4", 62, 80),
]

for base_name, start, end in test_splits:
    # Save PDF
    out_pdf = pymupdf.open()
    out_pdf.insert_pdf(doc, from_page=start, to_page=end - 1)
    pdf_out_path = os.path.join(SPLIT_DIR, f"{base_name}.pdf")
    out_pdf.save(pdf_out_path)
    out_pdf.close()

    # Save Text
    txt_out_path = os.path.join(SPLIT_DIR, f"{base_name}.txt")
    full_text = []
    for page_idx in range(start, end):
        p_text = doc[page_idx].get_text()
        full_text.append(f"===== PAGE {page_idx + 1} =====\n{p_text}")
    with open(txt_out_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(full_text))

    print(f"Created logical test: {pdf_out_path} & .txt ({end - start} pages)")

doc.close()
print("PDF split completed successfully!")
