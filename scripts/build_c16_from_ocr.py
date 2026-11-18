# Generator that reads OCR text files and builds complete, valid JSONs for Tests 36, 37, 38
import json
import os
import sys
import re
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.verify_cambridge_16 import BOOK_KEYS

OCR_DIR = "/tmp/c16_ocr"
TESTS_DIR = "data/tests"

def read_ocr(test_name, page_name):
    p = os.path.join(OCR_DIR, test_name, page_name)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def clean_page(text):
    # Remove headers, footers, page numbers
    lines = text.split("\n")
    cleaned = []
    for line in lines:
        l = line.strip()
        if re.match(r"^Test\s+\d+$", l, re.I):
            continue
        if re.match(r"^(READING|LISTENING)(\s+PASSAGE\s+\d+)?$", l, re.I):
            continue
        if re.match(r"^You should spend about 20 minutes.*$", l, re.I):
            continue
        if re.match(r"^\d{1,3}$", l): # page number
            continue
        if re.match(r"^.*p\.\s*\d+.*$", l) and ("p." in l and len(l) < 30):
            continue
        cleaned.append(line)
    return "\n".join(cleaned).strip()

def build_test_36_reading():
    p1_raw = clean_page(read_ocr("test2", "p-007.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-008.txt"))
    p1_q_raw = clean_page(read_ocr("test2", "p-009.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-010.txt"))
    p1_content = f"{p1_raw}\n\n![The White Horse of Uffington](/uploads/images/test-36-white-horse.png)\n\n{p1_q_raw}"

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "Most geoglyphs in England are located in a particular area of the country.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "There are more geoglyphs in the shape of a horse than any other creature.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "A recent dating of the Uffington White Horse indicates that people were mistaken about its age.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Historians have come to an agreement about the origins of the Long Man of Wilmington.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "Geoglyphs were created by people placing white chalk on the hillside.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "Many geoglyphs in England are no longer visible.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "The shape of some geoglyphs has been altered over time.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "The fame of the Uffington White Horse is due to its size.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "near an ancient road known as the 9 ________", "blank": True}, "correctAnswer": "Ridgeway"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "first reference to White Horse Hill appears in 10 ________ from the 1070s", "blank": True}, "correctAnswer": "documents"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "according to analysis of the surrounding 11 ________ , the Horse is Late Bronze Age / Early Iron Age", "blank": True}, "correctAnswer": "soil"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "was a representation of goddess Epona – associated with protection of horses and 12 ________", "blank": True}, "correctAnswer": "fertility"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "was a representation of a Welsh goddess called 13 ________", "blank": True}, "correctAnswer": "Rhiannon"},
    ]

    # Passage 2
    p2_raw = clean_page(read_ocr("test2", "p-011.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-012.txt"))
    p2_q_raw = clean_page(read_ocr("test2", "p-013.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-014.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-015.txt"))
    p2_content = f"{p2_raw}\n\n{p2_q_raw}"

    summary_opts = [
        {"label": "A", "text": "solution"},
        {"label": "B", "text": "partnership"},
        {"label": "C", "text": "destruction"},
        {"label": "D", "text": "exaggeration"},
        {"label": "E", "text": "cleanliness"},
        {"label": "F", "text": "regulations"},
        {"label": "G", "text": "illness"},
        {"label": "H", "text": "nutrition"},
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about microbes in the first paragraph?", "options": [{"label": "A", "text": "They adapt quickly to their environment."}, {"label": "B", "text": "The risk they pose has been exaggerated."}, {"label": "C", "text": "They are more plentiful in animal life than plant life."}, {"label": "D", "text": "They will continue to exist for longer than the human race."}]}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the second paragraph, the writer is impressed by the fact that", "options": [{"label": "A", "text": "each species tends to have vastly different microbes."}, {"label": "B", "text": "some parts of the body contain relatively few microbes."}, {"label": "C", "text": "the average individual has more microbial cells than human ones."}, {"label": "D", "text": "scientists have limited understanding of how microbial cells behave."}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer doing in the fifth paragraph?", "options": [{"label": "A", "text": "explaining how a discovery was made"}, {"label": "B", "text": "comparing scientists' theories about microbes"}, {"label": "C", "text": "describing confusion among scientists"}, {"label": "D", "text": "giving details of how microbes cause disease"}]}, "correctAnswer": "A"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "only a relatively small number lead to 17 ________ .", "options": summary_opts}, "correctAnswer": "G"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "our relationship with microbes is one based on 18 ________ .", "options": summary_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Our poor 19 ________ ,", "options": summary_opts}, "correctAnswer": "H"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "our excessive focus on 20 ________ are upsetting the bacterial balance", "options": summary_opts}, "correctAnswer": "E"},
        {"number": 21, "order": 20, "type": "TRUE_FALSE_NG", "content": {"stem": "It is possible that using antibacterial products in the home fails to have the desired effect.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 22, "order": 21, "type": "TRUE_FALSE_NG", "content": {"stem": "It is a good idea to ensure that children come into contact with as few bacteria as possible.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "Yong's book contains more case studies than are necessary.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "The case study about bacteria that prevent squid from being attacked may have limited appeal.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 25, "order": 24, "type": "TRUE_FALSE_NG", "content": {"stem": "Efforts to control dengue fever have been surprisingly successful.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 26, "order": 25, "type": "TRUE_FALSE_NG", "content": {"stem": "Microbes that reduce the risk of infection have already been put inside the walls of some hospital wards.", "options": ynng_opts}, "correctAnswer": "NO"},
    ]

    # Passage 3
    p3_raw = clean_page(read_ocr("test2", "p-016.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-017.txt"))
    p3_q_raw = clean_page(read_ocr("test2", "p-018.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-019.txt")) + "\n\n" + clean_page(read_ocr("test2", "p-020.txt"))
    p3_content = f"{p3_raw}\n\n{p3_q_raw}"

    wise_opts = [
        {"label": "A", "text": "opinions"},
        {"label": "B", "text": "confidence"},
        {"label": "C", "text": "view"},
        {"label": "D", "text": "modesty"},
        {"label": "E", "text": "problems"},
        {"label": "F", "text": "objectivity"},
        {"label": "G", "text": "fairness"},
        {"label": "H", "text": "experiences"},
        {"label": "I", "text": "range"},
        {"label": "J", "text": "reasons"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make in the first paragraph?", "options": [{"label": "A", "text": "Wisdom appears to be unique to the human race."}, {"label": "B", "text": "A basic assumption about wisdom may be wrong."}, {"label": "C", "text": "Concepts of wisdom may depend on the society we belong to."}, {"label": "D", "text": "There is still much to be discovered about the nature of wisdom."}]}, "correctAnswer": "B"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Igor Grossmann suggest about the ability to make wise decisions?", "options": [{"label": "A", "text": "It can vary greatly from one person to another."}, {"label": "B", "text": "Earlier research into it was based on unreliable data."}, {"label": "C", "text": "The importance of certain influences on it was underestimated."}, {"label": "D", "text": "Various branches of psychology define it according to their own criteria."}]}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the third paragraph, Grossmann claims that the level of wisdom an individual shows", "options": [{"label": "A", "text": "can be greater than they think it is."}, {"label": "B", "text": "will be different in different circumstances."}, {"label": "C", "text": "may be determined by particular aspects of their personality."}, {"label": "D", "text": "should develop over time as a result of their life experiences."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is described in the fifth paragraph?", "options": [{"label": "A", "text": "a difficulty encountered when attempting to reason wisely"}, {"label": "B", "text": "an example of the type of person who is likely to reason wisely"}, {"label": "C", "text": "a controversial view about the benefits of reasoning wisely"}, {"label": "D", "text": "a recommended strategy that can help people to reason wisely"}]}, "correctAnswer": "D"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "It is important to have a certain degree of 31 ________", "options": wise_opts}, "correctAnswer": "D"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "and to take into account 32 ________ which may not be the same as our own.", "options": wise_opts}, "correctAnswer": "A"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "We should also be able to take a broad 33 ________ of any situation.", "options": wise_opts}, "correctAnswer": "C"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Grossmann also believes that it is better to regard scenarios with 34 ________ .", "options": wise_opts}, "correctAnswer": "F"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "we focus more on 35 ________ and on other moral ideals,", "options": wise_opts}, "correctAnswer": "G"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Students participating in the job prospects experiment could choose one of two perspectives to take.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Participants in the couples experiment were aware that they were taking part in a study about wise reasoning.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "In the couples experiments, the length of the couples' relationships had an impact on the results.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "In both experiments, the participants who looked at the situation from a more detached viewpoint tended to make wiser decisions.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "Grossmann believes that a person's wisdom is determined by their intelligence to only a very limited extent.", "options": tfng_opts}, "correctAnswer": "TRUE"},
    ]

    return {
        "title": "Test 36.C16.02 - Reading",
        "slug": "test-36-reading",
        "skill": "READING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "C61.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Reading Passage 1", "content": p1_content, "questions": p1_questions},
            {"order": 1, "title": "Reading Passage 2", "content": p2_content, "questions": p2_questions},
            {"order": 2, "title": "Reading Passage 3", "content": p3_content, "questions": p3_questions},
        ]
    }

def main():
    os.makedirs(TESTS_DIR, exist_ok=True)
    t36_r = build_test_36_reading()
    with open(os.path.join(TESTS_DIR, "test-36-reading.json"), "w", encoding="utf-8") as f:
        json.dump(t36_r, f, indent=2, ensure_ascii=False)
    print("Built test-36-reading.json successfully!")

if __name__ == "__main__":
    main()
