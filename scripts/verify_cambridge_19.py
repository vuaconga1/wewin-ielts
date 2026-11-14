import json
import os

slugs = [
    'test-19-listening', 'test-19-reading',
    'test-20-listening', 'test-20-reading',
    'test-21-listening', 'test-21-reading',
    'test-22-listening', 'test-22-reading',
]

print("=== DETAILED VERIFICATION OF CAMBRIDGE 19 TESTS ===")
all_ok = True
for slug in slugs:
    p = os.path.join('data', 'tests', f'{slug}.json')
    with open(p, encoding='utf-8') as f:
        data = json.load(f)
    
    parts = data['parts']
    expected_parts = 4 if data['skill'] == 'LISTENING' else 3
    if len(parts) != expected_parts:
        print(f"ERROR: {slug} expected {expected_parts} parts, got {len(parts)}")
        all_ok = False
        
    all_qs = []
    for p_idx, part in enumerate(parts):
        for q in part['questions']:
            all_qs.append(q)
            
    if len(all_qs) != 40:
        print(f"ERROR: {slug} expected 40 questions, got {len(all_qs)}")
        all_ok = False
        
    numbers = [q['number'] for q in all_qs]
    if numbers != list(range(1, 41)):
        print(f"ERROR: {slug} questions numbers mismatch: {numbers}")
        all_ok = False
        
    # Check correct answers present
    missing_answers = [q['number'] for q in all_qs if not q.get('correctAnswer')]
    if missing_answers:
        print(f"ERROR: {slug} missing correct answers for Qs: {missing_answers}")
        all_ok = False
        
    # Check audio files for listening
    if data['skill'] == 'LISTENING':
        for af in data.get('audioFiles', []):
            rel_path = af.lstrip('/')
            if not os.path.exists(os.path.join('public', rel_path)):
                print(f"ERROR: {slug} audio file missing: {rel_path}")
                all_ok = False
                
    # Check test 19 map image
    if slug == 'test-19-listening':
        if not os.path.exists('public/uploads/images/test-19-map.png'):
            print("ERROR: test-19-map.png missing")
            all_ok = False
            
    print(f"OK: {slug} | Skill: {data['skill']} | Parts: {len(parts)} | Questions: {len(all_qs)} (1..40) | Title: {data['title']}")

if all_ok:
    print("\nALL CHECKS PASSED PERFECTLY!")
else:
    print("\nSOME CHECKS FAILED!")
