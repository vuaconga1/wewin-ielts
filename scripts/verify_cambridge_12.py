# Comprehensive direct cross-check of all 8 Cambridge 12 test JSONs against official answer keys (Pages 109-116)
import json
import os

BOOK_KEYS = {
    "test-27-listening": {
        1: "mountains", 2: "horse", 3: "gardens", 4: "lunch", 5: "map",
        6: "experience", 7: "Ratchesons", 8: "helmet", 9: "shops", 10: "267",
        11: "A", 12: "A", 13: "C", 14: "C", 15: "A", 16: "E", 17: "F", 18: "C", 19: "D", 20: "B",
        21: "B", 22: "C", 23: "C", 24: "budget", 25: "employment", 26: "safety", 27: "insurance", 28: "diary", 29: "database", 30: "museum",
        31: "damage", 32: "side effects", 33: "bridge", 34: "confusion", 35: "smartphone",
        36: "resources", 37: "unnecessary", 38: "chocolate bar", 39: "problem", 40: "market share"
    },
    "test-27-reading": {
        1: "NOT GIVEN", 2: "FALSE", 3: "FALSE", 4: "TRUE", 5: "TRUE",
        6: "taste", 7: "cheaper", 8: "convenient", 9: "image", 10: "sustainable", 11: "recycled", 12: "biodiversity", 13: "desertification",
        14: "antiques", 15: "triumph", 16: "information", 17: "contact", 18: "hunt", 19: "aimless", 20: "educational", 21: "trainspotting",
        22: "NOT GIVEN", 23: "FALSE", 24: "NOT GIVEN", 25: "TRUE", 26: "TRUE",
        27: "vi", 28: "viii", 29: "ii", 30: "iv", 31: "iii", 32: "vii",
        33: "fire science", 34: "investigators", 35: "evidence", 36: "prosecution",
        37: "NOT GIVEN", 38: "YES", 39: "NO", 40: "NO"
    },
    "test-28-listening": {
        1: "2.45", 2: "band", 3: "play", 4: "scientist", 5: "river",
        6: "grandparents", 7: "Handsworth", 8: "traditional", 9: "outdoor", 10: "logo",
        11: "B", 12: "C", 13: "A", 14: "B", 15: "C", 16: "F", 17: "B", 18: "E", 19: "G", 20: "C",
        21: "C", 22: "B", 23: "C", 24: "A", 25: "C", 26: "E", 27: "G", 28: "D", 29: "C", 30: "A",
        31: "bullying", 32: "superiority", 33: "personality", 34: "structural", 35: "absence",
        36: "confidence", 37: "visions", 38: "democratic", 39: "respect", 40: "mediator"
    },
    "test-28-reading": {
        1: "A", 2: "B", 3: "H", 4: "D", 5: "B", 6: "C", 7: "G", 8: "B", 9: "A", 10: "D", 11: "E", 12: "C", 13: "D",
        14: "iv", 15: "vi", 16: "viii", 17: "v", 18: "i", 19: "vii", 20: "iii",
        21: "TRUE", 22: "FALSE", 23: "FALSE", 24: "NOT GIVEN", 25: "rubber", 26: "farmer",
        27: "eye movements", 28: "language co-activation", 29: "Stroop Task", 30: "conflict management", 31: "cognitive control",
        32: "YES", 33: "NOT GIVEN", 34: "NO", 35: "NO", 36: "NOT GIVEN", 37: "D", 38: "G", 39: "B", 40: "C"
    },
    "test-29-listening": {
        1: "travel", 2: "history", 3: "study", 4: "teenagers", 5: "kitchen",
        6: "crime", 7: "appointment", 8: "sugar", 9: "stamps", 10: "parking",
        11: "D", 12: "E", 13: "A", 14: "C", 15: "C", 16: "B", 17: "A", 18: "stress", 19: "weight", 20: "families",
        21: "C", 22: "E", 23: "H", 24: "B", 25: "A", 26: "F", 27: "A", 28: "C", 29: "B", 30: "B",
        31: "insects", 32: "behaviour", 33: "father", 34: "complex", 35: "reproduction",
        36: "control", 37: "duck", 38: "language", 39: "food", 40: "cost"
    },
    "test-29-reading": {
        1: "v", 2: "iii", 3: "viii", 4: "i", 5: "iv", 6: "vi", 7: "ii",
        8: "pirates", 9: "food", 10: "oil", 11: "settlers", 12: "species", 13: "eggs",
        14: "D", 15: "C", 16: "F", 17: "G", 18: "D", 19: "B",
        20: "vaccinations", 21: "antibiotics", 22: "mosquitoes", 23: "factories", 24: "forests", 25: "Polio", 26: "mountain",
        27: "dopamine", 28: "pleasure", 29: "caudate", 30: "anticipatory phase", 31: "food",
        32: "B", 33: "C", 34: "A", 35: "B", 36: "D",
        37: "F", 38: "B", 39: "E", 40: "C"
    },
    "test-30-listening": {
        1: "temporary", 2: "doctor", 3: "Africa", 4: "youth", 5: "May",
        6: "cheese", 7: "Arbuthnot", 8: "DG7 4PH", 9: "Tuesday", 10: "talk",
        11: "A", 12: "C", 13: "B", 14: "B", 15: "H", 16: "C", 17: "F", 18: "G", 19: "I", 20: "B",
        21: "classification", 22: "worst", 23: "slides", 24: "issues",
        25: "F", 26: "A", 27: "E", 28: "C", 29: "G", 30: "B",
        31: "garden", 32: "political", 33: "work", 34: "fountain", 35: "social",
        36: "lively", 37: "training", 38: "culture", 39: "nature", 40: "silent"
    },
    "test-30-reading": {
        1: "obsidian", 2: "spears", 3: "beads", 4: "impurities", 5: "Romans",
        6: "lead", 7: "clouding", 8: "taxes",
        9: "TRUE", 10: "FALSE", 11: "NOT GIVEN", 12: "TRUE", 13: "FALSE",
        14: "D", 15: "A", 16: "C", 17: "A", 18: "C", 19: "E",
        20: "D", 21: "F", 22: "A",
        23: "NO", 24: "NOT GIVEN", 25: "YES", 26: "YES",
        27: "iv", 28: "ii", 29: "vi", 30: "viii", 31: "vii", 32: "i", 33: "iii",
        34: "YES", 35: "NOT GIVEN", 36: "NO", 37: "NO",
        38: "information", 39: "financial", 40: "shareholders"
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
            
            if actual_ans != exp_ans_lower and exp_ans_lower not in acceptable:
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
