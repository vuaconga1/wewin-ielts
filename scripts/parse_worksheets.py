#!/usr/bin/env python3
"""
parse_worksheets.py
Parses extracted worksheet text from all 5 parts in docs/worksheets_split/
into structured JSON files for the WeWIN IELTS web practice platform.
"""

import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(BASE_DIR, "docs", "worksheets_split")
OUT_DIR = os.path.join(BASE_DIR, "data", "learn", "worksheets")
CATALOG_PATH = os.path.join(BASE_DIR, "data", "learn", "worksheets-catalog.json")

os.makedirs(OUT_DIR, exist_ok=True)

# Common pronoun mapping for WS 1 Section A
PRONOUN_MAP = {
    "cat and horse": "THEY",
    "jack and i": "WE",
    "you and dave": "YOU",
    "cheese": "IT",
    "pamela": "SHE",
    "geese": "THEY",
    "school": "IT",
    "children": "THEY",
    "bicycle": "IT",
    "son": "HE",
    "shop": "IT",
    "mr. green": "HE",
    "friendship": "IT",
    "mary": "SHE",
    "books": "THEY",
    "plane": "IT",
    "cactus": "IT",
    "news": "IT",
    "flowers": "THEY",
    "daughter": "SHE",
    "sugar": "IT",
    "ann and kate": "THEY",
    "mice": "THEY",
    "buses": "THEY",
    "brother-in-law": "HE",
    "dolphin": "IT",
    "tom": "HE",
    "sister": "SHE",
    "sunshine": "IT",
    "parents": "THEY",
    "scissors": "THEY",
    "piano": "IT",
    "milk": "IT",
    "feet": "THEY",
    "tennis": "IT",
    "sky": "IT",
    "papers": "THEY",
    "picture": "IT",
    "the riggs family": "THEY",
}

WS1_SEC_B_ANSWERS = {
    1: ["is"],
    2: ["isn't", "is not"],
    3: ["are"],
    4: ["am not", "'m not"],
    5: ["is"],
    6: ["isn't", "is not"],
    7: ["is"],
    8: ["am not", "'m not"],
    9: ["are"],
    10: ["aren't / are", "are not / are"],
    11: ["is"],
    12: ["is"],
    13: ["is"],
    14: ["isn't", "is not"],
    15: ["is"],
    16: ["am / am not", "'m / 'm not"],
    17: ["is"],
    18: ["aren't / are", "are not / are"],
    19: ["is"],
    20: ["aren't / are", "are not / are"],
}

WS1_SEC_H_ANSWERS = {
    1: "b",
    2: "b",
    3: "d",
    4: "a",
    5: "c",
    6: "c",
    7: "b",
    8: "b",
}

def clean_dots(line: str) -> str:
    cleaned = re.sub(r'([\.…_]\s*){2,}', ' [gap] ', line)
    cleaned = re.sub(r'\s*\[gap\](\s*\[gap\])+', ' [gap]', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_instruction(inst: str) -> str:
    return re.sub(r'\s+', ' ', inst).strip()

def classify_section_type(instruction: str) -> str:
    low = instruction.lower()
    if "choose the best answer" in low or "circle the correct" in low or "circle it" in low:
        return "multiple_choice"
    if "rewrite" in low:
        return "sentence_rewrite"
    if "combine" in low or "join the sentences" in low:
        return "sentence_combine"
    if "ask questions for the underlined" in low or "ask questions" in low or "make questions" in low or "change the sentences into questions" in low:
        return "question_formation"
    if "read the passage and answer" in low or "read the paragraph and answer" in low or "read the text carefully" in low:
        return "reading_qa"
    if "build up" in low or "put the words in order" in low or "order to make" in low:
        return "sentence_building"
    if "match the" in low or "match each" in low:
        return "matching"
    if "true" in low and "false" in low and "correct" in low:
        return "error_correction"
    if "mistake" in low or "correct the" in low:
        return "error_correction"
    if "present continuous" in low or "simple past" in low or "past continuous" in low or "verbs in brackets" in low or "correct tense" in low or "supply" in low:
        return "verb_conjugation"
    if "postcard" in low or "letter" in low:
        return "passage_gap_fill"
    return "inline_gap_fill"

def parse_ws1_section_a(lines: list[str]) -> list[dict]:
    questions = []
    order = 1
    for raw in lines:
        raw_s = raw.strip()
        if not raw_s:
            continue
        items = re.split(r'([\.…_]\s*){2,}', raw_s)
        for it in items:
            it_clean = re.sub(r'([\.…_]\s*)+', '', it).strip()
            if not it_clean or len(it_clean) < 2:
                continue
            low_k = it_clean.lower()
            expected = PRONOUN_MAP.get(low_k, "")
            accepted = [expected] if expected else []
            if expected == "YOU":
                accepted.append("THEY")
            questions.append({
                "id": f"ws01-a-q{order:02d}",
                "order": order,
                "prompt": f"{it_clean} [gap]",
                "acceptedAnswers": accepted,
                "explanation": f"'{it_clean}' is replaced by subject pronoun '{expected}'." if expected else ""
            })
            order += 1
    return questions

def parse_numbered_questions(lines: list[str], sec_id_prefix: str, q_type: str, custom_answers: dict = None) -> list[dict]:
    questions = []
    current_q = None

    for line in lines:
        line_s = line.strip()
        if not line_s:
            continue
        
        num_m = re.match(r'^(\d+)[\.\)]\s*(.*)', line_s)
        if num_m:
            if current_q:
                questions.append(current_q)
            q_num = int(num_m.group(1))
            q_text = num_m.group(2).strip()
            
            accepted = []
            if custom_answers and q_num in custom_answers:
                ans_val = custom_answers[q_num]
                accepted = ans_val if isinstance(ans_val, list) else [ans_val]
            
            cleaned_prompt = clean_dots(q_text)
            if "[gap]" not in cleaned_prompt and q_type in ["inline_gap_fill", "verb_conjugation"]:
                cleaned_prompt += " [gap]"

            current_q = {
                "id": f"{sec_id_prefix}-q{q_num:02d}",
                "order": q_num,
                "prompt": cleaned_prompt,
                "acceptedAnswers": accepted,
                "explanation": ""
            }
        else:
            if current_q:
                opt_m = re.findall(r'([a-d]\))\s*([^\s\)]+)', line_s)
                if opt_m:
                    if "options" not in current_q:
                        current_q["options"] = []
                    for opt_letter, opt_val in opt_m:
                        current_q["options"].append(f"{opt_letter} {opt_val}")
                elif line_s.startswith(('a)', 'b)', 'c)', 'd)')):
                    if "options" not in current_q:
                        current_q["options"] = []
                    current_q["options"].append(line_s)
                elif re.match(r'^[…\.\s\-_]{3,}$', line_s):
                    pass
                elif line_s.startswith(('Example:', 'Ex:')):
                    current_q["sampleAnswer"] = line_s
                else:
                    if not current_q.get("options"):
                        current_q["prompt"] += " " + clean_dots(line_s)

    if current_q:
        questions.append(current_q)

    return questions

def parse_all_worksheets():
    files = [
        (1, "Worksheets_Part1_Trang_001-040_WS01-10.pdf", "Trang 001 - 040"),
        (2, "Worksheets_Part2_Trang_041-080_WS11-23.pdf", "Trang 041 - 080"),
        (3, "Worksheets_Part3_Trang_081-119_WS24-36.pdf", "Trang 081 - 119"),
        (4, "Worksheets_Part4_Trang_120-157_WS37-51.pdf", "Trang 120 - 157"),
        (5, "Worksheets_Part5_Trang_158-175_WS52-60.pdf", "Trang 158 - 175"),
    ]

    catalog = []
    total_qs_all = 0

    for part_num, fname, prange in files:
        txt_path = f"/tmp/{fname.replace('.pdf', '.txt')}"
        if not os.path.exists(txt_path):
            import subprocess
            pdf_file = os.path.join(PDF_DIR, fname)
            subprocess.run(["pdftotext", pdf_file, txt_path])

        with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read().replace('\x0c', '\n')

        ws_matches = list(re.finditer(r'WORKSHEET\s+(\d+)\s*\n\s*SUBJECT\s*:\s*([^\n]+)', text, re.I))
        
        for idx, m in enumerate(ws_matches):
            start = m.start()
            end = ws_matches[idx+1].start() if idx+1 < len(ws_matches) else len(text)
            ws_text = text[start:end]
            
            ws_num = int(m.group(1))
            ws_subj = m.group(2).strip()
            
            if part_num == 1 and idx == 6 and ws_num == 7 and "Present" in ws_subj:
                ws_id = "ws-07-review"
                ws_slug = "ws-07-review-present-simple-continuous"
                ws_title = "WORKSHEET 7 (Review)"
                ws_order = 7
            elif part_num == 1 and idx == 7 and ws_num == 7 and "Past" in ws_subj:
                ws_id = "ws-07"
                ws_slug = "ws-07-simple-past-tense"
                ws_title = "WORKSHEET 7"
                ws_order = 8
            else:
                ws_id = f"ws-{ws_num:02d}"
                slug_subj = re.sub(r'[^a-zA-Z0-9]+', '-', ws_subj.lower()).strip('-')
                ws_slug = f"ws-{ws_num:02d}-{slug_subj}"
                ws_title = f"WORKSHEET {ws_num}"
                ws_order = ws_num if part_num > 1 or idx <= 6 else ws_num + 1

            sec_splits = re.split(r'\n([A-Z]\))\s*', ws_text)
            sections = []

            for s_idx in range(1, len(sec_splits), 2):
                sec_key = sec_splits[s_idx].replace(')', '')
                sec_body = sec_splits[s_idx+1].strip()
                lines = [l.strip() for l in sec_body.split('\n') if l.strip()]
                if not lines:
                    continue
                
                instruction = clean_instruction(lines[0])
                content_lines = lines[1:]
                sec_type = classify_section_type(instruction)
                sec_id = f"{ws_id}-sec-{sec_key.lower()}"
                
                if ws_id == "ws-01" and sec_key == "A":
                    questions = parse_ws1_section_a(content_lines)
                elif ws_id == "ws-01" and sec_key == "B":
                    questions = parse_numbered_questions(content_lines, sec_id, sec_type, WS1_SEC_B_ANSWERS)
                elif ws_id == "ws-01" and sec_key == "H":
                    questions = parse_numbered_questions(content_lines, sec_id, sec_type, WS1_SEC_H_ANSWERS)
                else:
                    questions = parse_numbered_questions(content_lines, sec_id, sec_type)
                
                if not questions and content_lines:
                    q_order = 1
                    for c_line in content_lines:
                        if len(c_line) > 3 and not re.match(r'^[…\.\s\-_]{3,}$', c_line):
                            cleaned = clean_dots(c_line)
                            if "[gap]" not in cleaned and sec_type in ["inline_gap_fill", "verb_conjugation"]:
                                cleaned += " [gap]"
                            questions.append({
                                "id": f"{sec_id}-q{q_order:02d}",
                                "order": q_order,
                                "prompt": cleaned,
                                "acceptedAnswers": [],
                                "explanation": ""
                            })
                            q_order += 1

                sections.append({
                    "id": sec_id,
                    "sectionKey": sec_key,
                    "instruction": instruction,
                    "type": sec_type,
                    "questions": questions
                })

            total_questions = sum(len(s["questions"]) for s in sections)
            total_qs_all += total_questions

            level = "A1" if ws_num <= 4 else ("A2" if ws_num <= 20 else ("B1" if ws_num <= 45 else "B2"))

            lesson_data = {
                "id": ws_id,
                "order": ws_order,
                "part": part_num,
                "slug": ws_slug,
                "title": ws_title,
                "subject": ws_subj,
                "subjectVi": f"Ngữ pháp bài {ws_num}: {ws_subj}",
                "level": level,
                "pageRange": f"Part {part_num} (WS {ws_num})",
                "sections": sections
            }

            out_file = os.path.join(OUT_DIR, f"{ws_id}.json")
            with open(out_file, "w", encoding="utf-8") as f_out:
                json.dump(lesson_data, f_out, ensure_ascii=False, indent=2)

            catalog.append({
                "id": ws_id,
                "order": ws_order,
                "part": part_num,
                "slug": ws_slug,
                "title": ws_title,
                "subject": ws_subj,
                "subjectVi": lesson_data["subjectVi"],
                "level": lesson_data["level"],
                "pageRange": lesson_data["pageRange"],
                "sectionCount": len(sections),
                "questionCount": total_questions,
            })

    catalog.sort(key=lambda x: x["order"])
    with open(CATALOG_PATH, "w", encoding="utf-8") as f_cat:
        json.dump({"worksheets": catalog}, f_cat, ensure_ascii=False, indent=2)
    print(f"Parsed {len(catalog)} worksheets, total {total_qs_all} questions.")

if __name__ == "__main__":
    parse_all_worksheets()
