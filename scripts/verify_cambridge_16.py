# Comprehensive direct cross-check of all 8 Cambridge 16 test JSONs against official answer keys (Pages 121-128)
import json
import os

BOOK_KEYS = {
    "test-35-listening": {
        1: "egg", 2: "tower", 3: "car", 4: "animals", 5: "bridge", 6: "movie / film", 7: "decorate", 8: "Wednesdays", 9: "Fradstone", 10: "parking",
        11: "C", 12: "A", 13: "B", 14: "C", 15: "H", 16: "C", 17: "G", 18: "B", 19: "I", 20: "A",
        21: "C", 22: "E", 23: "B", 24: "E", 25: "D", 26: "C", 27: "A", 28: "H", 29: "F", 30: "G",
        31: "practical", 32: "publication", 33: "choices", 34: "negative", 35: "play", 36: "capitalism", 37: "depression", 38: "logic", 39: "opportunity", 40: "practice / practise"
    },
    "test-35-reading": {
        1: "FALSE", 2: "FALSE", 3: "NOT GIVEN", 4: "TRUE", 5: "TRUE", 6: "FALSE", 7: "TRUE",
        8: "violent", 9: "tool", 10: "meat", 11: "photographer", 12: "game", 13: "frustration",
        14: "iv", 15: "vii", 16: "ii", 17: "v", 18: "i", 19: "viii", 20: "vi",
        21: "city", 22: "priests", 23: "trench", 24: "location", 25: "B", 26: "D",
        27: "B", 28: "D", 29: "C", 30: "D", 31: "G", 32: "E", 33: "C", 34: "F", 35: "B", 36: "A", 37: "C", 38: "A", 39: "B", 40: "C"
    },
    "test-36-listening": {
        1: "frame", 2: "195", 3: "payment", 4: "Grandparents", 5: "colour / color", 6: "hand", 7: "background", 8: "focus", 9: "ten / 10 days", 10: "plastic",
        11: "C", 12: "B", 13: "A", 14: "A", 15: "C", 16: "D", 17: "A", 18: "B", 19: "B", 20: "C",
        21: "B", 22: "A", 23: "C", 24: "C", 25: "history", 26: "paper", 27: "humans / people", 28: "stress", 29: "graph", 30: "evaluate",
        31: "creativity", 32: "therapy", 33: "fitness", 34: "balance", 35: "brain", 36: "motivation", 37: "isolation", 38: "calories", 39: "obesity", 40: "habit"
    },
    "test-36-reading": {
        1: "TRUE", 2: "NOT GIVEN", 3: "TRUE", 4: "FALSE", 5: "FALSE", 6: "TRUE", 7: "TRUE", 8: "NOT GIVEN",
        9: "Ridgeway", 10: "documents", 11: "soil", 12: "fertility", 13: "Rhiannon",
        14: "D", 15: "C", 16: "A", 17: "G", 18: "B", 19: "H", 20: "E",
        21: "YES", 22: "NO", 23: "NOT GIVEN", 24: "YES", 25: "NOT GIVEN", 26: "NO",
        27: "B", 28: "C", 29: "B", 30: "D", 31: "D", 32: "A", 33: "C", 34: "F", 35: "G",
        36: "FALSE", 37: "NOT GIVEN", 38: "NOT GIVEN", 39: "TRUE", 40: "TRUE"
    },
    "test-37-listening": {
        1: "park", 2: "blue", 3: "reference", 4: "story", 5: "rain", 6: "snack", 7: "medication", 8: "helmet", 9: "tent", 10: "199",
        11: "A", 12: "C", 13: "B", 14: "C", 15: "D", 16: "F", 17: "A", 18: "H", 19: "C", 20: "G",
        21: "C", 22: "D", 23: "C", 24: "E", 25: "C", 26: "A", 27: "B", 28: "A", 29: "A", 30: "C",
        31: "grandmother", 32: "decade", 33: "equipment", 34: "economic", 35: "basic", 36: "round", 37: "bone", 38: "rough", 39: "style", 40: "sheep"
    },
    "test-37-reading": {
        1: "FALSE", 2: "NOT GIVEN", 3: "FALSE", 4: "TRUE", 5: "TRUE",
        6: "lightweight", 7: "bronze", 8: "levels", 9: "hull", 10: "triangular", 11: "music", 12: "grain", 13: "towboats",
        14: "D", 15: "C", 16: "F", 17: "H", 18: "G", 19: "B",
        20: "microorganisms / micro-organisms", 21: "reindeer", 22: "insects", 23: "B", 24: "C", 25: "A", 26: "C",
        27: "NOT GIVEN", 28: "TRUE", 29: "TRUE", 30: "NOT GIVEN", 31: "FALSE", 32: "FALSE",
        33: "H", 34: "D", 35: "G", 36: "C", 37: "A", 38: "warm (winter)", 39: "summer", 40: "mustard plant(s) / mustard"
    },
    "test-38-listening": {
        1: "28th", 2: "550", 3: "Chervil", 4: "garage", 5: "garden", 6: "parking", 7: "wood", 8: "bridge", 9: "monument", 10: "March",
        11: "C", 12: "A", 13: "B", 14: "B", 15: "C", 16: "F", 17: "A", 18: "I", 19: "E", 20: "H",
        21: "B", 22: "C", 23: "B", 24: "C", 25: "C", 26: "F", 27: "D", 28: "E", 29: "B", 30: "A",
        31: "spice(s)", 32: "colony / settlement", 33: "fat", 34: "head", 35: "movement", 36: "balance / balancing", 37: "brain", 38: "smell", 39: "rats", 40: "forest"
    },
    "test-38-reading": {
        1: "posts", 2: "canal", 3: "ventilation", 4: "lid", 5: "weight", 6: "climbing",
        7: "FALSE", 8: "NOT GIVEN", 9: "FALSE", 10: "TRUE", 11: "gold", 12: "(the) architect('s) (name)", 13: "(the) harbour / harbor",
        14: "A", 15: "B", 16: "D", 17: "B", 18: "D", 19: "H", 20: "F", 21: "B", 22: "C",
        23: "YES", 24: "NO", 25: "NOT GIVEN", 26: "YES",
        27: "iii", 28: "vi", 29: "ii", 30: "i", 31: "vii", 32: "v",
        33: "C", 34: "B", 35: "A", 36: "NO", 37: "NOT GIVEN", 38: "YES", 39: "NO", 40: "YES"
    }
}

def normalize(ans):
    return str(ans).strip().lower()

def check_match(expected, actual, acceptable=None):
    exp_norm = normalize(expected)
    act_norm = normalize(actual)
    
    # Direct match
    if exp_norm == act_norm:
        return True
    
    # Check slash variants
    exp_variants = [normalize(v) for v in expected.split("/") if v.strip()]
    if act_norm in exp_variants:
        return True
    
    # Check acceptable list
    if acceptable:
        acc_norms = [normalize(a) for a in acceptable]
        for v in exp_variants:
            if v in acc_norms:
                return True
        if act_norm in acc_norms:
            return True

    # Check parentheses optional variants e.g. 24(th) April -> 24 april / 24th april
    import re
    clean_v1 = normalize(re.sub(r'[\(\)]', '', expected))
    clean_v2 = normalize(re.sub(r'\([^\)]*\)', '', expected).strip())
    if act_norm in [clean_v1, clean_v2]:
        return True
        
    return False

def verify():
    total_q = 0
    total_matches = 0
    discrepancies = []

    for slug, keys in BOOK_KEYS.items():
        json_path = os.path.join("data", "tests", f"{slug}.json")
        if not os.path.exists(json_path):
            continue

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        questions = [q for part in data["parts"] for q in part["questions"]]
        
        for q in questions:
            total_q += 1
            num = q["number"]
            expected = keys.get(num)
            actual = q.get("correctAnswer")
            acceptable = q.get("acceptableAnswers", [])

            if expected is None:
                discrepancies.append(f"[{slug}] Q{num}: No official key defined in script!")
                continue

            if check_match(expected, actual, acceptable):
                total_matches += 1
            else:
                discrepancies.append(f"[{slug}] Q{num}: Expected '{expected}', Got '{actual}' (acceptable: {acceptable})")

    print(f"Checked {total_q} questions across available tests.")
    if discrepancies:
        print(f"Found {len(discrepancies)} discrepancies:")
        for d in discrepancies:
            print("  - " + d)
    else:
        print(">>> ALL CHECKED ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<")

if __name__ == "__main__":
    verify()

