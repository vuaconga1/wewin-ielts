import json

# Verified authentic listening keys
keys = {
    "test-23-listening": {
        1: "fish", 2: "roof", 3: "Spanish", 4: "vegetarian", 5: "Audley",
        6: "hotel", 7: "reviews", 8: "local", 9: "30", 10: "average",
        11: "A", 12: "B", 13: "C", 14: "A", 15: "B", 16: "C",
        17: "A", 18: "E", 19: "C", 20: "E",
        21: "C", 22: "E", 23: "A", 24: "C", 25: "A", 26: "B",
        27: "A", 28: "B", 29: "A", 30: "C",
        31: "factories", 32: "dead", 33: "whale", 34: "apartments", 35: "park",
        36: "art", 37: "beaches", 38: "ferry", 39: "bikes", 40: "drone"
    },
    "test-24-listening": {
        1: "break", 2: "time", 3: "shower", 4: "money", 5: "memory",
        6: "lifting", 7: "fall", 8: "taxi", 9: "insurance", 10: "stress",
        11: "D", 12: "I", 13: "H", 14: "E", 15: "A", 16: "B",
        17: "B", 18: "A", 19: "B", 20: "A",
        21: "D", 22: "G", 23: "B", 24: "A", 25: "E",
        26: "C", 27: "A", 28: "A", 29: "B", 30: "C",
        31: "photos", 32: "vegan", 33: "chefs", 34: "journalists", 35: "health",
        36: "coffee", 37: "environment", 38: "reputation", 39: "price", 40: "soil"
    },
    "test-25-listening": {
        1: "239", 2: "modern", 3: "lamp", 4: "Aaron", 5: "damage",
        6: "electronic", 7: "insurance", 8: "Space", 9: "app", 10: "exchanges",
        11: "B", 12: "A", 13: "A", 14: "C", 15: "B", 16: "C",
        17: "B", 18: "A", 19: "G", 20: "E",
        21: "B", 22: "A", 23: "C", 24: "A", 25: "C", 26: "B",
        27: "F", 28: "E", 29: "B", 30: "D",
        31: "adaptation", 32: "cognitive", 33: "desks", 34: "taps", 35: "blue",
        36: "voice", 37: "pregnant", 38: "shoulders", 39: "police", 40: "temperature"
    },
    "test-26-listening": {
        1: "King's", 2: "125", 3: "walking", 4: "boat", 5: "Tuesday",
        6: "space", 7: "vegetarian", 8: "2:30", 9: "75", 10: "port",
        11: "B", 12: "C", 13: "A", 14: "C", 15: "D", 16: "F",
        17: "B", 18: "H", 19: "C", 20: "G",
        21: "C", 22: "E", 23: "A", 24: "C", 25: "C", 26: "A",
        27: "A", 28: "B", 29: "B", 30: "C",
        31: "rats", 32: "snakes", 33: "tourism", 34: "traffic", 35: "rain",
        36: "poison", 37: "building", 38: "dog", 39: "noise", 40: "combination"
    }
}

for slug, expected_keys in keys.items():
    with open(f"data/tests/{slug}.json", encoding="utf-8") as f:
        data = json.load(f)
    print(f"\nChecking {slug}:")
    mismatches = []
    for part in data["parts"]:
        for q in part["questions"]:
            num = q["number"]
            ans = q.get("correctAnswer", "")
            exp = expected_keys.get(num, "")
            # Normalize check
            if ans.strip().lower() != exp.strip().lower():
                # Check if it's alternative like King's vs Kings, or multi-choice pairing
                mismatches.append((num, ans, exp))
    if mismatches:
        print(f"  Mismatches ({len(mismatches)}):")
        for num, ans, exp in mismatches:
            print(f"    Q{num}: current='{ans}' vs authentic='{exp}'")
    else:
        print("  All 40 answers match authentic key 100%!")
