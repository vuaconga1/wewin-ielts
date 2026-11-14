import os
import subprocess
import tempfile
import pymupdf

PARTS = [
    ("Cambridge_19_Part1_Trang_001-032_Intro_Test1.pdf", "Cambridge_19_Part1_Trang_001-032_Intro_Test1.txt"),
    ("Cambridge_19_Part2_Trang_033-054_Test2.pdf", "Cambridge_19_Part2_Trang_033-054_Test2.txt"),
    ("Cambridge_19_Part3_Trang_055-077_Test3.pdf", "Cambridge_19_Part3_Trang_055-077_Test3.txt"),
    ("Cambridge_19_Part4_Trang_078-098_Test4.pdf", "Cambridge_19_Part4_Trang_078-098_Test4.txt"),
    ("Cambridge_19_Part5_Trang_099-127_Audioscripts_AnswerKeys.pdf", "Cambridge_19_Part5_Trang_099-127_Audioscripts_AnswerKeys.txt"),
    ("Cambridge_19_Part6_Trang_128-138_Sample_Writing_Answers.pdf", "Cambridge_19_Part6_Trang_128-138_Sample_Writing_Answers.txt"),
]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPLIT_DIR = os.path.join(BASE_DIR, "docs", "cambridge_19_split")
OCR_SCRIPT = os.path.join(BASE_DIR, "scripts", "batch_ocr.ps1")

def run_ocr_for_pdf(pdf_name, txt_name):
    pdf_path = os.path.join(SPLIT_DIR, pdf_name)
    txt_path = os.path.join(SPLIT_DIR, txt_name)
    
    print(f"\nProcessing {pdf_name} -> {txt_name}...")
    doc = pymupdf.open(pdf_path)
    print(f"Total pages: {len(doc)}")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for idx, page in enumerate(doc):
            pix = page.get_pixmap(dpi=200)
            page_img_path = os.path.join(temp_dir, f"page_{idx+1:03d}.png")
            pix.save(page_img_path)
            
        print("Pages rendered to PNG. Calling PowerShell Windows Media OCR...")
        cmd = [
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", OCR_SCRIPT,
            temp_dir,
            txt_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print("OCR Error:", res.stderr)
            raise RuntimeError(f"OCR failed for {pdf_name}")
        print(f"Completed {txt_name} (Size: {os.path.getsize(txt_path)} bytes)")

def main():
    for pdf_name, txt_name in PARTS:
        run_ocr_for_pdf(pdf_name, txt_name)
    print("\nAll Cambridge 19 parts successfully OCR'd!")

if __name__ == "__main__":
    main()
