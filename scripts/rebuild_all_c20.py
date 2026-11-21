import os
import json
from datetime import datetime, timezone

import rebuild_c20_t1 as t1
import rebuild_c20_t2 as t2
import rebuild_c20_t3 as t3
import rebuild_c20_t4 as t4

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "data", "tests")

now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

reading_tests = [
    t1.get_test_23_reading(),
    t2.get_test_24_reading(),
    t3.get_test_25_reading(),
    t4.get_test_26_reading(),
]

for test in reading_tests:
    slug = test["slug"]
    test["sourceFolder"] = "CAM 20 Reading - Listening (đẹp).pdf"
    test["savedAt"] = now_iso

    # Reset question order per part to 0..N-1
    for part_idx, part in enumerate(test["parts"]):
        part["order"] = part_idx
        for q_idx, q in enumerate(part["questions"]):
            q["order"] = q_idx

    out_path = os.path.join(OUT_DIR, f"{slug}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(test, f, ensure_ascii=False, indent=2)

    total_qs = sum(len(p["questions"]) for p in test["parts"])
    print(f"Generated {slug}.json: 3 parts, {total_qs} questions (size: {os.path.getsize(out_path)} bytes)")

# Update test-26-listening Q1 & Q8
t26_l_path = os.path.join(OUT_DIR, "test-26-listening.json")
if os.path.exists(t26_l_path):
    with open(t26_l_path, "r", encoding="utf-8") as f:
        t26_l = json.load(f)
    for part in t26_l["parts"]:
        for q in part["questions"]:
            if q["number"] == 1:
                q["correctAnswer"] = "King's"
                q["acceptableAnswers"] = ["King's", "Kings"]
            elif q["number"] == 8:
                q["correctAnswer"] = "2:30"
                q["acceptableAnswers"] = ["2:30", "2.30", "two thirty"]
    t26_l["savedAt"] = now_iso
    with open(t26_l_path, "w", encoding="utf-8") as f:
        json.dump(t26_l, f, ensure_ascii=False, indent=2)
    print("Updated test-26-listening.json with normalized Q1 and Q8 answers.")

print("\nAll Cambridge 20 Reading & Listening files built successfully!")
