import os
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "docs", "cambridge_12", "Cambridge IELTS 12", "Cambridge IELTS 12 PDF.pdf")
SPLIT_DIR = os.path.join(ROOT, "docs", "cambridge_12_split")
FIXED_DIR = os.path.join(SPLIT_DIR, "fixed_40_pages")

os.makedirs(SPLIT_DIR, exist_ok=True)
os.makedirs(FIXED_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
total_pages = len(doc)
print(f"Total pages in original Cambridge 12 PDF: {total_pages}")

# 1. Split into fixed <= 40 page chunks
fixed_splits = [
    ("Cambridge_12_Part1_Trang_001-040.pdf", 0, 40),
    ("Cambridge_12_Part2_Trang_041-080.pdf", 40, 80),
    ("Cambridge_12_Part3_Trang_081-120.pdf", 80, 120),
    ("Cambridge_12_Part4_Trang_121-129.pdf", 120, total_pages),
]

for filename, start, end in fixed_splits:
    out_pdf = pymupdf.open()
    out_pdf.insert_pdf(doc, from_page=start, to_page=end - 1)
    out_path = os.path.join(FIXED_DIR, filename)
    out_pdf.save(out_path)
    out_pdf.close()
    print(f"Created fixed split: {out_path} ({end - start} pages)")

# 2. Split logical sections (all <= 40 pages)
test_splits = [
    ("Cambridge_12_Part1_Trang_001-022_Intro_Test1", 0, 22),
    ("Cambridge_12_Part2_Trang_023-045_Test2", 22, 45),
    ("Cambridge_12_Part3_Trang_046-066_Test3", 45, 66),
    ("Cambridge_12_Part4_Trang_067-087_Test4", 66, 87),
    ("Cambridge_12_Part5_Trang_088-108_Audioscripts", 87, 108),
    ("Cambridge_12_Part6_Trang_109-129_AnswerKeys_WritingSample", 108, total_pages),
]

for base_name, start, end in test_splits:
    # Save PDF
    out_pdf = pymupdf.open()
    out_pdf.insert_pdf(doc, from_page=start, to_page=end - 1)
    pdf_out_path = os.path.join(SPLIT_DIR, f"{base_name}.pdf")
    out_pdf.save(pdf_out_path)
    out_pdf.close()

    # Save Text (if available directly from PDF)
    txt_out_path = os.path.join(SPLIT_DIR, f"{base_name}.txt")
    full_text = []
    for page_idx in range(start, end):
        p_text = doc[page_idx].get_text()
        full_text.append(f"===== PAGE {page_idx + 1} =====\n{p_text}")
    with open(txt_out_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(full_text))

    print(f"Created logical split: {pdf_out_path} ({end - start} pages)")

doc.close()
print("\nPDF split completed successfully!")
