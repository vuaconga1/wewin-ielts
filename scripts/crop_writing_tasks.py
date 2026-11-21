import os
import pymupdf
from PIL import Image

doc = pymupdf.open("docs/cambridge_21_split/Cambridge IELTS 21.pdf")
os.makedirs("public/uploads/writing", exist_ok=True)

test_configs = [
    {
        "page_idx": 29, # Test 15 (Page 30)
        "title_query": "Number of jobs",
        "bottom_query": "Year",
        "out_name": "test-15-writing-task1.png",
    },
    {
        "page_idx": 51, # Test 16 (Page 52)
        "title_query": "redesign",
        "bottom_query": "Outdoor",
        "out_name": "test-16-writing-task1.png",
    },
    {
        "page_idx": 72, # Test 17 (Page 73)
        "title_query": "formation of rain-shadow",
        "bottom_query": "desert",
        "out_name": "test-17-writing-task1.png",
    },
    {
        "page_idx": 94, # Test 18 (Page 95)
        "title_query": "Categories of library",
        "bottom_query": "Reliability of wi-fi",
        "out_name": "test-18-writing-task1.png",
    }
]

for cfg in test_configs:
    p = doc[cfg["page_idx"]]
    t_rects = p.search_for(cfg["title_query"])
    b_rects = p.search_for(cfg["bottom_query"])
    print(f"Page {cfg['page_idx']+1}:")
    print("  Title rects:", t_rects)
    print("  Bottom rects:", b_rects)
