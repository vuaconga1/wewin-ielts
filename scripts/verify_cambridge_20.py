import json
import os
import urllib.request

slugs = [
    'test-23-listening', 'test-23-reading',
    'test-24-listening', 'test-24-reading',
    'test-25-listening', 'test-25-reading',
    'test-26-listening', 'test-26-reading',
]

print("=== DETAILED VERIFICATION OF CAMBRIDGE 20 TESTS ===")
all_ok = True

# 1. Check local JSON files
for slug in slugs:
    p = os.path.join('data', 'tests', f'{slug}.json')
    if not os.path.exists(p):
        print(f"ERROR: {p} does not exist")
        all_ok = False
        continue

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

    missing_answers = [q['number'] for q in all_qs if not q.get('correctAnswer')]
    if missing_answers:
        print(f"ERROR: {slug} missing correct answers for Qs: {missing_answers}")
        all_ok = False

    # Check audio files
    if data['skill'] == 'LISTENING':
        for af in data.get('audioFiles', []):
            rel_path = af.lstrip('/')
            if not os.path.exists(os.path.join('public', rel_path)):
                print(f"ERROR: {slug} audio file missing: {rel_path}")
                all_ok = False

    # Check test 25 map image
    if slug == 'test-25-listening':
        if not os.path.exists('public/uploads/images/test-25-map.png'):
            print("ERROR: test-25-map.png missing")
            all_ok = False

    print(f"PASS [JSON]: {slug} | Skill: {data['skill']} | Parts: {len(parts)} | Questions: {len(all_qs)} (1..40) | Title: {data['title']}")

# 2. Check R2 CDN URLs
print("\n=== VERIFYING CLOUDFLARE R2 CDN ASSETS ===")
r2_base = "https://pub-9de21ff141584031af658ddfb8e11aec.r2.dev/uploads"
test_urls = [
    f"{r2_base}/audio/test-23-section-1.m4a",
    f"{r2_base}/audio/test-24-section-1.m4a",
    f"{r2_base}/audio/test-25-section-1.m4a",
    f"{r2_base}/audio/test-26-section-1.m4a",
    f"{r2_base}/images/test-25-map.png",
]

for url in test_urls:
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.status
            ct = res.headers.get("Content-Type")
            print(f"PASS [R2 CDN]: {url} -> HTTP {status} ({ct})")
    except Exception as e:
        print(f"ERROR [R2 CDN]: {url} -> {e}")
        all_ok = False

if all_ok:
    print("\nALL CAMBRIDGE 20 VERIFICATION CHECKS PASSED 100% PERFECTLY!")
else:
    print("\nSOME CHECKS FAILED!")
