import json
import os
import sys

from cambridge_17_t1 import get_test_39
from cambridge_17_t2 import get_test_40
from cambridge_17_t3 import get_test_41
from cambridge_17_t4 import get_test_42

def build_all():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "tests")
    os.makedirs(out_dir, exist_ok=True)

    builders = [
        ("test-39", get_test_39),
        ("test-40", get_test_40),
        ("test-41", get_test_41),
        ("test-42", get_test_42),
    ]

    for prefix, builder in builders:
        lis, read = builder()
        
        lis_path = os.path.join(out_dir, f"{lis['slug']}.json")
        with open(lis_path, "w", encoding="utf-8") as f:
            json.dump(lis, f, indent=2, ensure_ascii=False)
        print(f"Wrote {lis_path} (Parts: {len(lis['parts'])}, Questions: {sum(len(p['questions']) for p in lis['parts'])})")

        read_path = os.path.join(out_dir, f"{read['slug']}.json")
        with open(read_path, "w", encoding="utf-8") as f:
            json.dump(read, f, indent=2, ensure_ascii=False)
        print(f"Wrote {read_path} (Parts: {len(read['parts'])}, Questions: {sum(len(p['questions']) for p in read['parts'])})")

if __name__ == "__main__":
    build_all()
