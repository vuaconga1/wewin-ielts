"""
Build and generate complete Cambridge 19 Academic tests (Tests 1-4).
Numbering follows existing tests in system (Tests 1-18 already exist):
- Cam 19 Test 1 -> Test 19.C19.01 (Listening & Reading)
- Cam 19 Test 2 -> Test 20.C19.02 (Listening & Reading)
- Cam 19 Test 3 -> Test 21.C19.03 (Listening & Reading)
- Cam 19 Test 4 -> Test 22.C19.04 (Listening & Reading)
"""
import os
import sys
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cambridge_19_t1 as t1
import cambridge_19_t2 as t2
import cambridge_19_t3 as t3
import cambridge_19_t4 as t4

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "data", "tests")
os.makedirs(OUT_DIR, exist_ok=True)

test_pairs = [
    t1.get_test_19(),
    t2.get_test_20(),
    t3.get_test_21(),
    t4.get_test_22(),
]

now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

generated_files = []

for pair in test_pairs:
    for test in pair:
        slug = test["slug"]
        title = test["title"]
        skill = test["skill"]
        
        test["sourceFolder"] = "Cambridge 19.pdf"
        test["savedAt"] = now_iso
        
        # Reset question order per part to 0..N-1
        for part_idx, part in enumerate(test["parts"]):
            part["order"] = part_idx
            for q_idx, q in enumerate(part["questions"]):
                q["order"] = q_idx

        out_path = os.path.join(OUT_DIR, f"{slug}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(test, f, ensure_ascii=False, indent=2)

        file_size = os.path.getsize(out_path)
        q_count = sum(len(p["questions"]) for p in test["parts"])
        generated_files.append((slug, title, skill, len(test["parts"]), q_count, file_size, out_path))
        print(f"Generated: {slug}.json ({title}) | Parts: {len(test['parts'])}, Questions: {q_count}, Size: {file_size} bytes")

print(f"\nSuccessfully generated all {len(generated_files)} Cambridge 19 test JSON files in {OUT_DIR}!")
