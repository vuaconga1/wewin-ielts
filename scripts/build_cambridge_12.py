# Build and format Cambridge 12 test JSONs into data/tests/
import sys
import json
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.cambridge_12_t1 import get_test_27
from scripts.cambridge_12_t2 import get_test_28
from scripts.cambridge_12_t3 import get_test_29
from scripts.cambridge_12_t4 import get_test_30

def build_all():
    os.makedirs("data/tests", exist_ok=True)
    all_tests = []
    all_tests.extend(get_test_27())
    all_tests.extend(get_test_28())
    all_tests.extend(get_test_29())
    all_tests.extend(get_test_30())

    now_iso = datetime.now(timezone.utc).isoformat()

    for test in all_tests:
        # Standardize test fields
        test["examType"] = "ACADEMIC"
        test["sourceFolder"] = "Cambridge IELTS 12 PDF.pdf"
        test["savedAt"] = now_iso

        # Standardize parts
        for p_idx, part in enumerate(test.get("parts", [])):
            part["order"] = p_idx
            if "audioUrl" in part:
                audio_url = part.pop("audioUrl")
                if "meta" not in part or not isinstance(part["meta"], dict):
                    part["meta"] = {}
                part["meta"]["audioUrl"] = audio_url

            # Ensure questions orders and numbers
            for q_idx, q in enumerate(part.get("questions", [])):
                q["order"] = q["number"] - 1

        slug = test["slug"]
        out_path = os.path.join("data", "tests", f"{slug}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(test, f, indent=2, ensure_ascii=False)
        
        total_q = sum(len(p["questions"]) for p in test["parts"])
        print(f"Generated {out_path} ({test['skill']}): {len(test['parts'])} parts, {total_q} questions")

if __name__ == "__main__":
    build_all()
