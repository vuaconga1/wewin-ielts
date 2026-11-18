# Cross-check of all 8 Cambridge 17 test JSONs against official answer keys (Pages 119-126)
import json
import os
import re

BOOK_KEYS = {
    "test-39-listening": {
        1: "litter", 2: "dogs", 3: "insects", 4: "butterflies", 5: "wall", 6: "island", 7: "boots", 8: "beginners", 9: "spoons", 10: "35 / thirty five",
        11: "A", 12: "C", 13: "B", 14: "B", 15: "A", 16: "D", 17: "B", 18: "C", 19: "D", 20: "E",
        21: "A", 22: "B", 23: "B", 24: "A", 25: "C", 26: "C", 27: "A", 28: "E", 29: "F", 30: "C",
        31: "puzzle", 32: "logic", 33: "confusion", 34: "meditation", 35: "stone", 36: "coins", 37: "tree", 38: "breathing", 39: "paper", 40: "anxiety"
    },
    "test-39-reading": {
        1: "population", 2: "suburbs", 3: "businessmen", 4: "funding", 5: "press", 6: "soil",
        7: "FALSE", 8: "NOT GIVEN", 9: "TRUE", 10: "TRUE", 11: "FALSE", 12: "FALSE", 13: "NOT GIVEN",
        14: "A", 15: "F", 16: "E", 17: "D", 18: "fortress", 19: "bullfights", 20: "opera", 21: "salt", 22: "shops",
        23: "C", 24: "D", 25: "B", 26: "E",
        27: "H", 28: "J", 29: "F", 30: "B", 31: "D", 32: "NOT GIVEN", 33: "NO", 34: "NO", 35: "YES",
        36: "B", 37: "C", 38: "A", 39: "B", 40: "D"
    },
    "test-40-listening": {
        1: "collecting", 2: "records", 3: "West", 4: "transport", 5: "art", 6: "hospital", 7: "garden", 8: "quiz", 9: "tickets", 10: "poster",
        11: "B", 12: "C", 13: "C", 14: "B", 15: "D", 16: "C", 17: "G", 18: "A", 19: "E", 20: "F",
        21: "D", 22: "E", 23: "D", 24: "C", 25: "A", 26: "E", 27: "F", 28: "B", 29: "C", 30: "C",
        31: "321,000", 32: "vocabulary", 33: "podcast", 34: "smartphones", 35: "bilingual", 36: "playground", 37: "picture", 38: "grammar", 39: "identity", 40: "fluent"
    },
    "test-40-reading": {
        1: "rock", 2: "cave", 3: "clay", 4: "Essenes", 5: "Hebrew",
        6: "NOT GIVEN", 7: "FALSE", 8: "TRUE", 9: "TRUE", 10: "FALSE", 11: "FALSE", 12: "TRUE", 13: "NOT GIVEN",
        14: "C", 15: "B", 16: "E", 17: "A", 18: "C", 19: "B", 20: "D",
        21: "A", 22: "C", 23: "A", 24: "flavour / flavor", 25: "size", 26: "salt",
        27: "D", 28: "A", 29: "A", 30: "C", 31: "A", 32: "NO", 33: "NOT GIVEN", 34: "YES", 35: "NO", 36: "NOT GIVEN",
        37: "F", 38: "D", 39: "E", 40: "B"
    },
    "test-41-listening": {
        1: "family", 2: "fit", 3: "hotels", 4: "Carrowniskey", 5: "week", 6: "bay", 7: "September", 8: "19 / nineteen", 9: "30 / thirty", 10: "boots",
        11: "B", 12: "E", 13: "C", 14: "C", 15: "A", 16: "E", 17: "D", 18: "G", 19: "F", 20: "C",
        21: "B", 22: "A", 23: "A", 24: "B", 25: "C", 26: "A", 27: "D", 28: "B", 29: "F", 30: "H",
        31: "mud", 32: "feathers", 33: "shape", 34: "moon", 35: "neck", 36: "evidence", 37: "destinations", 38: "oceans", 39: "recovery", 40: "atlas"
    },
    "test-41-reading": {
        1: "carnivorous", 2: "scent", 3: "pouch", 4: "fossil", 5: "habitat",
        6: "TRUE", 7: "FALSE", 8: "NOT GIVEN", 9: "FALSE", 10: "NOT GIVEN", 11: "FALSE", 12: "TRUE", 13: "NOT GIVEN",
        14: "F", 15: "G", 16: "A", 17: "H", 18: "B", 19: "E", 20: "C",
        21: "B", 22: "C", 23: "solid", 24: "(Sumatran) orangutan / orang-utan", 25: "carbon stocks", 26: "biodiversity",
        27: "D", 28: "B", 29: "C", 30: "D", 31: "C",
        32: "NO", 33: "YES", 34: "NOT GIVEN", 35: "NO",
        36: "H", 37: "D", 38: "I", 39: "B", 40: "F"
    },
    "test-42-listening": {
        1: "floor(s)", 2: "fridge", 3: "shirts", 4: "windows", 5: "balcony", 6: "electrician", 7: "dust", 8: "police", 9: "training", 10: "review",
        11: "A", 12: "A", 13: "A", 14: "C", 15: "A", 16: "C", 17: "B", 18: "C", 19: "B", 20: "A",
        21: "C", 22: "E", 23: "A", 24: "D", 25: "B", 26: "F", 27: "A", 28: "D", 29: "C", 30: "G",
        31: "golden", 32: "healthy", 33: "climate", 34: "rock(s)", 35: "diameter", 36: "tube", 37: "fire", 38: "steam", 39: "cloudy", 40: "litre / liter"
    },
    "test-42-reading": {
        1: "FALSE", 2: "FALSE", 3: "NOT GIVEN", 4: "TRUE", 5: "NOT GIVEN", 6: "TRUE",
        7: "droppings", 8: "coffee", 9: "mosquitoes", 10: "protein", 11: "unclean", 12: "culture", 13: "houses",
        14: "E", 15: "A", 16: "D", 17: "F", 18: "C",
        19: "descendants", 20: "sermon", 21: "fine", 22: "innovation",
        23: "B", 24: "E", 25: "B", 26: "D",
        27: "D", 28: "E", 29: "F", 30: "B", 31: "H", 32: "E",
        33: "FALSE", 34: "NOT GIVEN", 35: "NOT GIVEN", 36: "TRUE",
        37: "memory", 38: "numbers", 39: "communication", 40: "visual"
    }
}

def normalize(ans):
    return str(ans).strip().lower()

def check_match(expected, actual, acceptable=None):
    exp_norm = normalize(expected)
    act_norm = normalize(actual)
    
    if exp_norm == act_norm:
        return True
    
    exp_variants = [normalize(v) for v in expected.split("/") if v.strip()]
    if act_norm in exp_variants:
        return True
    
    if acceptable:
        acc_norms = [normalize(a) for a in acceptable]
        for v in exp_variants:
            if v in acc_norms:
                return True
        if act_norm in acc_norms:
            return True

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
                discrepancies.append(f"[{slug}] Q{num}: Expected \x27{expected}\x27, Got \x27{actual}\x27 (acceptable: {acceptable})")

    print(f"Checked {total_q} questions across available tests.")
    if discrepancies:
        print(f"Found {len(discrepancies)} discrepancies:")
        for d in discrepancies:
            print("  - " + d)
    else:
        print(">>> ALL CHECKED ANSWERS MATCH THE OFFICIAL BOOK KEYS 100%! ZERO DISCREPANCIES! <<<")

if __name__ == "__main__":
    verify()
