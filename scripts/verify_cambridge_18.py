# Comprehensive direct cross-check of all 8 Cambridge 18 test JSONs against official answer keys (Pages 119-126)
import json
import os

BOOK_KEYS = {
    "test-31-listening": {
        1: "DW30 7YZ", 2: "24(th) April", 3: "dentist", 4: "parking", 5: "Claxby",
        6: "late", 7: "evening", 8: "supermarket", 9: "pollution", 10: "storage",
        11: "C", 12: "A", 13: "A", 14: "B", 15: "E", 16: "B", 17: "G", 18: "D", 19: "A", 20: "F",
        21: "A", 22: "B", 23: "A", 24: "C", 25: "B", 26: "A", 27: "B", 28: "E", 29: "A", 30: "C",
        31: "fences", 32: "family", 33: "helicopters", 34: "stress", 35: "sides",
        36: "breathing", 37: "feet", 38: "employment", 39: "weapons", 40: "tourism"
    },
    "test-31-reading": {
        1: "lettuces", 2: "1,000 kg", 3: "(food) consumption", 4: "pesticides", 5: "journeys",
        6: "producers", 7: "flavour", 8: "TRUE", 9: "NOT GIVEN", 10: "FALSE",
        11: "TRUE", 12: "FALSE", 13: "NOT GIVEN",
        14: "B", 15: "A", 16: "C", 17: "E", 18: "B", 19: "B", 20: "C", 21: "C",
        22: "fire", 23: "nutrients", 24: "cavities", 25: "hawthorn", 26: "rare",
        27: "C", 28: "F", 29: "A", 30: "E", 31: "B",
        32: "sustainability", 33: "fuel", 34: "explosions", 35: "bankrupt",
        36: "C", 37: "D", 38: "B", 39: "D", 40: "A"
    },
    "test-32-listening": {
        1: "training", 2: "discount", 3: "taxi", 4: "service", 5: "English",
        6: "Wivenhoe", 7: "equipment", 8: "9.75", 9: "deliveries", 10: "Sunday",
        11: "B", 12: "E", 13: "B", 14: "C", 15: "G", 16: "C", 17: "D", 18: "B", 19: "H", 20: "A",
        21: "C", 22: "A", 23: "B", 24: "B", 25: "A", 26: "B", 27: "D", 28: "A", 29: "C", 30: "F",
        31: "convenient", 32: "suits", 33: "tailor", 34: "profession", 35: "visible",
        36: "string(s)", 37: "waist(s)", 38: "perfume", 39: "image", 40: "handbag"
    },
    "test-32-reading": {
        1: "(deer) antlers", 2: "(timber) posts", 3: "tree trunks", 4: "oxen", 5: "glaciers",
        6: "druids", 7: "burial", 8: "calendar",
        9: "TRUE", 10: "FALSE", 11: "FALSE", 12: "TRUE", 13: "NOT GIVEN",
        14: "C", 15: "A", 16: "B", 17: "D", 18: "C", 19: "D",
        20: "YES", 21: "NOT GIVEN", 22: "NO", 23: "YES",
        24: "C", 25: "A", 26: "E",
        27: "NOT GIVEN", 28: "NOT GIVEN", 29: "TRUE", 30: "FALSE", 31: "TRUE", 32: "NOT GIVEN", 33: "FALSE",
        34: "transport", 35: "staircases", 36: "engineering", 37: "rule", 38: "Roman", 39: "Paris", 40: "outwards"
    },
    "test-33-listening": {
        1: "Marrowfield", 2: "relative", 3: "socialise", 4: "full", 5: "Domestic Life",
        6: "clouds", 7: "timing", 8: "Animal Magic", 9: "(animal) movement", 10: "dark",
        11: "B", 12: "C", 13: "B", 14: "D", 15: "C", 16: "B", 17: "B", 18: "C", 19: "A", 20: "A",
        21: "A", 22: "E", 23: "B", 24: "D", 25: "G", 26: "E", 27: "B", 28: "C", 29: "F", 30: "A",
        31: "technical", 32: "cheap", 33: "thousands", 34: "identification", 35: "tracking",
        36: "military", 37: "location", 38: "prediction", 39: "database", 40: "trust"
    },
    "test-33-reading": {
        1: "G", 2: "D", 3: "C", 4: "F", 5: "architects", 6: "moisture", 7: "layers", 8: "speed",
        9: "C", 10: "A", 11: "B", 12: "D", 13: "A",
        14: "iii", 15: "viii", 16: "vi", 17: "v", 18: "vii", 19: "i", 20: "iv",
        21: "A", 22: "C", 23: "B", 24: "speed", 25: "fifty", 26: "strict",
        27: "B", 28: "A", 29: "C", 30: "C",
        31: "H", 32: "D", 33: "F", 34: "E", 35: "B",
        36: "NO", 37: "NOT GIVEN", 38: "YES", 39: "NO", 40: "NOT GIVEN"
    },
    "test-34-listening": {
        1: "receptionist", 2: "Medical", 3: "Chastons", 4: "appointments", 5: "database",
        6: "experience", 7: "confident", 8: "temporary", 9: "1.15", 10: "parking",
        11: "B", 12: "A", 13: "A", 14: "C", 15: "F", 16: "G", 17: "E", 18: "A", 19: "C", 20: "B",
        21: "B", 22: "D", 23: "D", 24: "A", 25: "C", 26: "G", 27: "F", 28: "A", 29: "B", 30: "C",
        31: "plot", 32: "poverty", 33: "Europe", 34: "poetry", 35: "drawings",
        36: "furniture", 37: "lamps", 38: "harbour", 39: "children", 40: "relatives"
    },
    "test-34-reading": {
        1: "D", 2: "C", 3: "E", 4: "B", 5: "D", 6: "energy", 7: "food", 8: "gardening", 9: "obesity",
        10: "C", 11: "D", 12: "A", 13: "D",
        14: "B", 15: "C", 16: "D", 17: "C", 18: "B", 19: "A", 20: "E", 21: "B", 22: "D",
        23: "YES", 24: "NO", 25: "NOT GIVEN", 26: "YES",
        27: "YES", 28: "NOT GIVEN", 29: "NO", 30: "NO",
        31: "I", 32: "F", 33: "A", 34: "C", 35: "H", 36: "E",
        37: "B", 38: "A", 39: "D", 40: "C"
    }
}

def check_all():
    errors = 0
    total_q = 0
    for slug, expected_keys in BOOK_KEYS.items():
        json_path = os.path.join("data", "tests", f"{slug}.json")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        q_dict = {}
        for part in data["parts"]:
            for q in part["questions"]:
                q_dict[q["number"]] = q
        
        for num, exp_ans in expected_keys.items():
            total_q += 1
            if num not in q_dict:
                print(f"[{slug}] Missing Q{num}")
                errors += 1
                continue
            
            q = q_dict[num]
            actual_ans = str(q.get("correctAnswer", "")).strip().lower()
            exp_ans_lower = str(exp_ans).strip().lower()
            acceptable = [str(a).strip().lower() for a in q.get("acceptableAnswers", [])]
            
            # Match directly or in acceptableAnswers or with parens stripped
            def clean(s):
                return s.replace("(", "").replace(")", "").strip()

            if actual_ans != exp_ans_lower and exp_ans_lower not in acceptable and clean(actual_ans) != clean(exp_ans_lower):
                print(f"[{slug}] Q{num} mismatch! Expected: {exp_ans}, Actual: {q.get('correctAnswer')}")
                errors += 1

    print(f"\nChecked {total_q} questions across 8 tests.")
    if errors == 0:
        print(">>> ALL 320 ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<")
    else:
        print(f"Encountered {errors} mismatches.")
        exit(1)

if __name__ == "__main__":
    check_all()

