import json
import os
import sys
import re
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.verify_cambridge_16 import BOOK_KEYS

BASE_OCR = "/home/wewin/.gemini/antigravity/brain/8816dbd8-e084-486e-bc54-de0314835e15/scratch/ocr"
TESTS_DIR = "data/tests"

def read_ocr(folder, filename):
    p = os.path.join(BASE_OCR, folder, filename)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def clean_page(text):
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

# =========================================================================
# TEST 37 (C16 Test 3)
# =========================================================================

def build_test_37_listening():
    p1_content = clean_page(read_ocr("txt_test3", "p-01.txt"))
    p2_content = clean_page(read_ocr("txt_test3", "p-02.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-03.txt"))
    p3_content = clean_page(read_ocr("txt_test3", "p-04.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-05.txt"))
    p4_content = clean_page(read_ocr("txt_test3", "p-06.txt"))

    # Part 1: Q1..10
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "First of all, children at this level are taken to practise in a 1 ________", "blank": True}, "correctAnswer": "park"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Instructors wear 2 ________ shirts.", "blank": True}, "correctAnswer": "blue"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "A 3 ________ is required and training is given.", "blank": True}, "correctAnswer": "reference"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "There are quiet times during the morning for a 4 ________ or a game.", "blank": True}, "correctAnswer": "story"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Classes are held even if there is 5 ________", "blank": True}, "correctAnswer": "rain"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "What to bring: a change of clothing, a 6 ________", "blank": True}, "correctAnswer": "snack"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Charlie's 7 ________", "blank": True}, "correctAnswer": "medication"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Before the class, his 8 ________ will be checked.", "blank": True}, "correctAnswer": "helmet"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "He should then go to the 9 ________ to meet his class instructor.", "blank": True}, "correctAnswer": "tent"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "The course costs 10 $ ________ per week.", "blank": True}, "correctAnswer": "199", "acceptableAnswers": ["199", "$199"]},
    ]

    # Part 2: Q11..20
    adv_opts = [
        {"label": "A", "text": "the active lifestyle"},
        {"label": "B", "text": "the above-average salaries"},
        {"label": "C", "text": "the flexible working opportunities"},
        {"label": "D", "text": "the opportunities for overseas travel"},
        {"label": "E", "text": "the chance to be in a natural environment"}
    ]
    disadv_opts = [
        {"label": "A", "text": "the increasing risk of accidents"},
        {"label": "B", "text": "being in a very quiet location"},
        {"label": "C", "text": "difficult weather conditions at times"},
        {"label": "D", "text": "the cost of housing"},
        {"label": "E", "text": "the level of physical fitness required"}
    ]
    job_info_opts = [
        {"label": "A", "text": "not a permanent job"},
        {"label": "B", "text": "involves leading a team"},
        {"label": "C", "text": "experience not essential"},
        {"label": "D", "text": "intensive work but also fun"},
        {"label": "E", "text": "chance to earn more through overtime"},
        {"label": "F", "text": "chance for rapid promotion"},
        {"label": "G", "text": "accommodation available"},
        {"label": "H", "text": "local travel involved"}
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Megan, what are the TWO main advantages of working in the agriculture and horticulture sectors? (Option 1)", "options": adv_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Megan, what are the TWO main advantages of working in the agriculture and horticulture sectors? (Option 2)", "options": adv_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following are likely to be disadvantages for people working outdoors? (Option 1)", "options": disadv_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following are likely to be disadvantages for people working outdoors? (Option 2)", "options": disadv_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Fresh food commercial manager", "options": job_info_opts}, "correctAnswer": "D"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Agronomist", "options": job_info_opts}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Fresh produce buyer", "options": job_info_opts}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Garden centre sales manager", "options": job_info_opts}, "correctAnswer": "H"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Tree technician", "options": job_info_opts}, "correctAnswer": "C"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Farm worker", "options": job_info_opts}, "correctAnswer": "G"},
    ]

    # Part 3: Q21..30
    sweet_opts = [
        {"label": "A", "text": "The results were what he had predicted."},
        {"label": "B", "text": "The experiment was simple to set up."},
        {"label": "C", "text": "A large sample of people was tested."},
        {"label": "D", "text": "The subjects were unaware of what they were drinking."},
        {"label": "E", "text": "The test was repeated several times for each person."}
    ]
    nut_opts = [
        {"label": "A", "text": "She used the wrong sort of nuts."},
        {"label": "B", "text": "She used an unsuitable chemical."},
        {"label": "C", "text": "She did not grind the nuts finely enough."},
        {"label": "D", "text": "The information on the nut package was incorrect."},
        {"label": "E", "text": "The weighing scales may have been unsuitable."}
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Adam make about his experiment on artificial sweeteners? (Option 1)", "options": sweet_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "D"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Adam make about his experiment on artificial sweeteners? (Option 2)", "options": sweet_opts}, "correctAnswer": "D", "acceptableAnswers": ["C", "D"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO problems did Rosie have when measuring the fat content of nuts? (Option 1)", "options": nut_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO problems did Rosie have when measuring the fat content of nuts? (Option 2)", "options": nut_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Adam suggests that restaurants could reduce obesity if their menus", "options": [{"label": "A", "text": "offered fewer options."}, {"label": "B", "text": "had more low-calorie foods."}, {"label": "C", "text": "were organised in a particular way."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students agree that food manufacturers deliberately", "options": [{"label": "A", "text": "make calorie counts hard to understand."}, {"label": "B", "text": "fail to provide accurate calorie counts."}, {"label": "C", "text": "use ineffective methods to reduce calories."}]}, "correctAnswer": "A"},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Rosie say about levels of exercise in England?", "options": [{"label": "A", "text": "The amount recommended is much too low."}, {"label": "B", "text": "Most people overestimate how much they do."}, {"label": "C", "text": "Women now exercise more than they used to."}]}, "correctAnswer": "B"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "Adam refers to the location and width of stairs in a train station to illustrate", "options": [{"label": "A", "text": "practical changes that can influence people’s behaviour."}, {"label": "B", "text": "methods of helping people who have mobility problems."}, {"label": "C", "text": "ways of preventing accidents by controlling crowd movement."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What do the students agree about including reference to exercise in their presentation?", "options": [{"label": "A", "text": "They should probably leave it out."}, {"label": "B", "text": "They need to do more research on it."}, {"label": "C", "text": "They should discuss this with their tutor."}]}, "correctAnswer": "A"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are the students going to do next for their presentation?", "options": [{"label": "A", "text": "prepare some slides for it"}, {"label": "B", "text": "find out how long they have for it"}, {"label": "C", "text": "decide on its content and organisation"}]}, "correctAnswer": "C"},
    ]

    # Part 4: Q31..40
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "We imagine someone like a 31 ________ knitting.", "blank": True}, "correctAnswer": "grandmother"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "A 32 ________ ago, knitting was expected to disappear.", "blank": True}, "correctAnswer": "decade"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "People are buying more 33 ________ for knitting nowadays.", "blank": True}, "correctAnswer": "equipment"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "gives support in times of 34 ________ difficulty", "blank": True}, "correctAnswer": "economic"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "requires only 35 ________ skills and little money to start", "blank": True}, "correctAnswer": "basic"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Findings show early knitted items to be 36 ________ in shape.", "blank": True}, "correctAnswer": "round"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The first needles were made of natural materials such as wood and 37 ________ .", "blank": True}, "correctAnswer": "bone"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Early yarns felt 38 ________ to touch.", "blank": True}, "correctAnswer": "rough"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Geographical areas had their own 39 ________ of knitting.", "blank": True}, "correctAnswer": "style"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "Everyday tasks like looking after 40 ________ were done while knitting.", "blank": True}, "correctAnswer": "sheep"},
    ]

    return {
        "title": "Test 37.C16.03 - Listening",
        "slug": "test-37-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "C61.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": p1_content, "questions": s1_questions, "meta": {"audioUrl": "/uploads/audio/test-37-section-1.mp3"}},
            {"order": 1, "title": "Part 2", "content": p2_content, "questions": s2_questions, "meta": {"audioUrl": "/uploads/audio/test-37-section-2.mp3"}},
            {"order": 2, "title": "Part 3", "content": p3_content, "questions": s3_questions, "meta": {"audioUrl": "/uploads/audio/test-37-section-3.mp3"}},
            {"order": 3, "title": "Part 4", "content": p4_content, "questions": s4_questions, "meta": {"audioUrl": "/uploads/audio/test-37-section-4.mp3"}},
        ]
    }

def build_test_37_reading():
    p1_raw = clean_page(read_ocr("txt_test3", "p-07.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-08.txt"))
    p1_q_raw = clean_page(read_ocr("txt_test3", "p-09.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-10.txt"))
    p1_content = f"{p1_raw}\n\n{p1_q_raw}"

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "The Romans’ shipbuilding skills were passed on to the Greeks and the Egyptians.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "Skilled craftsmen were needed for the mortise and tenon method of fixing planks.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "The later practice used by Mediterranean shipbuilders involved building the hull before the frame.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "The Romans called the Mediterranean Sea Mare Nostrum because they dominated its use.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "Most rowers on ships were people from the Roman army.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Warships were designed so that they were 6 ________ and moved quickly.", "blank": True}, "correctAnswer": "lightweight"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "A battering ram made of 7 ________ was included in the design", "blank": True}, "correctAnswer": "bronze"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Warships, such as the ‘trireme’, had rowers on three different 8 ________", "blank": True}, "correctAnswer": "levels"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "merchant ships had a broad 9 ________ that lay far below the surface of the sea.", "blank": True}, "correctAnswer": "hull"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "They had both square and 10 ________ sails.", "blank": True}, "correctAnswer": "triangular"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "On merchant ships and warships, 11 ________ was used to ensure rowers moved their oars in and out of the water at the same time.", "blank": True}, "correctAnswer": "music"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "Quantities of agricultural goods such as 12 ________ were transported", "blank": True}, "correctAnswer": "grain"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "The ships were pulled to the shore by 13 ________ .", "blank": True}, "correctAnswer": "towboats"},
    ]

    # Passage 2
    p2_raw = clean_page(read_ocr("txt_test3", "p-11.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-12.txt"))
    p2_q_raw = clean_page(read_ocr("txt_test3", "p-13.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-14.txt"))
    p2_content = f"{p2_raw}\n\n{p2_q_raw}"

    sec_opts_8 = [{"label": c, "text": f"Section {c}"} for c in "ABCDEFGH"]

    barrett_opts = [
        {"label": "A", "text": "Artefacts found in the higher mountain passes were limited to skiing equipment."},
        {"label": "B", "text": "Hunters went into the mountains even during periods of extreme cold."},
        {"label": "C", "text": "The number of artefacts from certain time periods was relatively low."},
        {"label": "D", "text": "Radiocarbon dating of artefacts produced some unreliable results."},
        {"label": "E", "text": "More artefacts were found in Oppland than at any other mountain site."}
    ]

    viking_opts = [
        {"label": "A", "text": "Hunters at this time benefited from an increased demand for goods."},
        {"label": "B", "text": "The beginning of the period saw the greatest growth in the wealth of Vikings."},
        {"label": "C", "text": "Vikings did not rely on ships alone to transport goods."},
        {"label": "D", "text": "Norwegian towns at this time attracted traders from around the world."},
        {"label": "E", "text": "Vikings were primarily interested in their trading links with the Middle East."}
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "an explanation for weapons being left behind in the mountains", "options": sec_opts_8}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "a reference to the physical difficulties involved in an archaeological expedition", "options": sec_opts_8}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "an explanation of why less food may have been available", "options": sec_opts_8}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a reference to the possibility of future archaeological discoveries", "options": sec_opts_8}, "correctAnswer": "H"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "examples of items that would have been traded", "options": sec_opts_8}, "correctAnswer": "G"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "a reference to the pressure archaeologists are under to work quickly", "options": sec_opts_8}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "They have little protection against 20 ________ , which means that they decay relatively quickly.", "blank": True}, "correctAnswer": "microorganisms", "acceptableAnswers": ["microorganisms", "micro-organisms"]},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "and 21 ________ gathered there in the summer months", "blank": True}, "correctAnswer": "reindeer"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "to avoid being attacked by 22 ________ on lower ground.", "blank": True}, "correctAnswer": "insects"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about the discoveries of Barrett's team? (Option 1)", "options": barrett_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about the discoveries of Barrett's team? (Option 2)", "options": barrett_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about the Viking Age? (Option 1)", "options": viking_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about the Viking Age? (Option 2)", "options": viking_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
    ]

    # Passage 3
    p3_raw = clean_page(read_ocr("txt_test3", "p-15.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-16.txt"))
    p3_q_raw = clean_page(read_ocr("txt_test3", "p-17.txt")) + "\n\n" + clean_page(read_ocr("txt_test3", "p-18.txt"))
    p3_content = f"{p3_raw}\n\n{p3_q_raw}"

    p3_questions = [
        {"number": 27, "order": 26, "type": "TRUE_FALSE_NG", "content": {"stem": "The Cambridge scientists’ discovery of the ‘thermometer molecule’ caused surprise among other scientists.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 28, "order": 27, "type": "TRUE_FALSE_NG", "content": {"stem": "The target for agricultural production by 2050 could be missed.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 29, "order": 28, "type": "TRUE_FALSE_NG", "content": {"stem": "Wheat and rice suffer from a rise in temperatures.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 30, "order": 29, "type": "TRUE_FALSE_NG", "content": {"stem": "It may be possible to develop crops that require less water.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 31, "order": 30, "type": "TRUE_FALSE_NG", "content": {"stem": "Plants grow faster in sunlight than in shade.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "Phytochromes change their state at the same speed day and night.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "mention of specialists who can make use of the research findings", "options": sec_opts_8}, "correctAnswer": "H"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "a reference to a potential benefit of the research findings", "options": sec_opts_8}, "correctAnswer": "D"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "scientific support for a traditional saying", "options": sec_opts_8}, "correctAnswer": "G"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "a reference to people traditionally making plans based on plant behaviour", "options": sec_opts_8}, "correctAnswer": "C"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "a reference to where the research has been reported", "options": sec_opts_8}, "correctAnswer": "A"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Daffodils are likely to flower early in response to 38 ________ weather.", "blank": True}, "correctAnswer": "warm", "acceptableAnswers": ["warm", "warm winter"]},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "If ash trees come into leaf before oak trees, the weather in 39 ________ will probably be wet.", "blank": True}, "correctAnswer": "summer"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "The research was carried out using a particular species of 40 ________ .", "blank": True}, "correctAnswer": "mustard", "acceptableAnswers": ["mustard", "mustard plant", "mustard plants"]},
    ]

    return {
        "title": "Test 37.C16.03 - Reading",
        "slug": "test-37-reading",
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

# =========================================================================
# TEST 38 (C16 Test 4)
# =========================================================================

def build_test_38_listening():
    p1_content = clean_page(read_ocr("txt_test4", "p-01.txt"))
    p2_content = clean_page(read_ocr("txt_test4", "p-02.txt")) + "\n\n![Recreation ground after proposed changes](/uploads/images/test-38-map.png)\n\n" + clean_page(read_ocr("txt_test4", "p-03.txt"))
    p3_content = clean_page(read_ocr("txt_test4", "p-04.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-05.txt"))
    p4_content = clean_page(read_ocr("txt_test4", "p-06.txt"))

    # Part 1: Q1..10
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "available for week beginning 1 ________ May", "blank": True}, "correctAnswer": "28th", "acceptableAnswers": ["28th", "28", "28th May"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "cost for the week: £ 2 ________", "blank": True}, "correctAnswer": "550", "acceptableAnswers": ["550", "£550"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "3 ________ Cottage (cost for the week: £480)", "blank": True}, "correctAnswer": "Chervil"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "building was originally a 4 ________", "blank": True}, "correctAnswer": "garage"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "walk through doors from living room into a 5 ________", "blank": True}, "correctAnswer": "garden"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "several 6 ________ spaces at the front", "blank": True}, "correctAnswer": "parking"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "central heating and stove that burns 7 ________", "blank": True}, "correctAnswer": "wood"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "views of old 8 ________ from living room", "blank": True}, "correctAnswer": "bridge"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "view of hilltop 9 ________ from the bedroom", "blank": True}, "correctAnswer": "monument"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "deadline for final payment: end of 10 ________", "blank": True}, "correctAnswer": "March"},
    ]

    # Part 2: Q11..20
    map_opts = [{"label": c, "text": f"Location {c}"} for c in "ABCDEFGHI"]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "A survey found people’s main concern about traffic in the area was", "options": [{"label": "A", "text": "cuts to public transport."}, {"label": "B", "text": "poor maintenance of roads."}, {"label": "C", "text": "changes in the type of traffic."}]}, "correctAnswer": "C"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which change will shortly be made to the cycle path next to the river?", "options": [{"label": "A", "text": "It will be widened."}, {"label": "B", "text": "It will be extended."}, {"label": "C", "text": "It will be resurfaced."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Plans for a pedestrian crossing have been postponed because", "options": [{"label": "A", "text": "the Post Office has moved."}, {"label": "B", "text": "the proposed location is unsafe."}, {"label": "C", "text": "funding is not available at present."}]}, "correctAnswer": "B"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "On Station Road, notices have been erected", "options": [{"label": "A", "text": "telling cyclists not to leave their bikes outside the station ticket office."}, {"label": "B", "text": "asking motorists to switch off engines when waiting at the level crossing."}, {"label": "C", "text": "warning pedestrians to leave enough time when crossing the railway line."}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "New car park", "options": map_opts}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "New cricket pitch", "options": map_opts}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Children’s playground", "options": map_opts}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Skateboard ramp", "options": map_opts}, "correctAnswer": "I"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Pavilion", "options": map_opts}, "correctAnswer": "E"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Notice board", "options": map_opts}, "correctAnswer": "H"},
    ]

    # Part 3: Q21..30
    bike_benefits_opts = [
        {"label": "A", "text": "reducing noise pollution"},
        {"label": "B", "text": "reducing traffic congestion"},
        {"label": "C", "text": "improving air quality"},
        {"label": "D", "text": "encouraging health and fitness"},
        {"label": "E", "text": "making cycling affordable"}
    ]
    bike_success_opts = [
        {"label": "A", "text": "Bikes should have a GPS system."},
        {"label": "B", "text": "The app should be easy to use."},
        {"label": "C", "text": "Public awareness should be raised."},
        {"label": "D", "text": "Only one scheme should be available."},
        {"label": "E", "text": "There should be a large network of cycle lanes."}
    ]
    city_opinion_opts = [
        {"label": "A", "text": "They agree it has been disappointing."},
        {"label": "B", "text": "They think it should be cheaper."},
        {"label": "C", "text": "They are surprised it has been so successful."},
        {"label": "D", "text": "They agree that more investment is required."},
        {"label": "E", "text": "They think the system has been well designed."},
        {"label": "F", "text": "They disagree about the reasons for its success."},
        {"label": "G", "text": "They think it has expanded too quickly."}
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO benefits of city bike-sharing schemes do the students agree are the most important? (Option 1)", "options": bike_benefits_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO benefits of city bike-sharing schemes do the students agree are the most important? (Option 2)", "options": bike_benefits_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students think are necessary for successful bike-sharing schemes? (Option 1)", "options": bike_success_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students think are necessary for successful bike-sharing schemes? (Option 2)", "options": bike_success_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Amsterdam", "options": city_opinion_opts}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Dublin", "options": city_opinion_opts}, "correctAnswer": "F"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "London", "options": city_opinion_opts}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Buenos Aires", "options": city_opinion_opts}, "correctAnswer": "E"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "New York", "options": city_opinion_opts}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Sydney", "options": city_opinion_opts}, "correctAnswer": "A"},
    ]

    # Part 4: Q31..40
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "1507 — Portuguese ships transporting 31 ________ stopped at the island to collect food and water.", "blank": True}, "correctAnswer": "spices", "acceptableAnswers": ["spices", "spice"]},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "1638 — The Dutch established a 32 ________ on the island.", "blank": True}, "correctAnswer": "colony", "acceptableAnswers": ["colony", "settlement"]},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "A Dutch painting suggests the dodo was very 33 ________ .", "blank": True}, "correctAnswer": "fat"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "The only remaining soft tissue is a dried 34 ________ .", "blank": True}, "correctAnswer": "head"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Recent studies of a dodo skeleton suggest the birds were capable of rapid 35 ________ .", "blank": True}, "correctAnswer": "movement"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "It's thought they were able to use their small wings to maintain 36 ________ .", "blank": True}, "correctAnswer": "balance", "acceptableAnswers": ["balance", "balancing"]},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Their 37 ________ was of average size.", "blank": True}, "correctAnswer": "brain"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Their sense of 38 ________ enabled them to find food.", "blank": True}, "correctAnswer": "smell"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "39 ________ also escaped onto the island and ate the birds’ eggs.", "blank": True}, "correctAnswer": "rats"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "The arrival of farming meant the 40 ________ was destroyed.", "blank": True}, "correctAnswer": "forest"},
    ]

    return {
        "title": "Test 38.C16.04 - Listening",
        "slug": "test-38-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "C61.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": p1_content, "questions": s1_questions, "meta": {"audioUrl": "/uploads/audio/test-38-section-1.mp3"}},
            {"order": 1, "title": "Part 2", "content": p2_content, "questions": s2_questions, "meta": {"audioUrl": "/uploads/audio/test-38-section-2.mp3"}},
            {"order": 2, "title": "Part 3", "content": p3_content, "questions": s3_questions, "meta": {"audioUrl": "/uploads/audio/test-38-section-3.mp3"}},
            {"order": 3, "title": "Part 4", "content": p4_content, "questions": s4_questions, "meta": {"audioUrl": "/uploads/audio/test-38-section-4.mp3"}},
        ]
    }

def build_test_38_reading():
    p1_raw = clean_page(read_ocr("txt_test4", "p-07.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-08.txt"))
    p1_diag = "![Roman Tunnels and Qanat System](/uploads/images/test-38-diagram.png)"
    p1_q_raw = clean_page(read_ocr("txt_test4", "p-09.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-10.txt"))
    p1_content = f"{p1_raw}\n\n{p1_diag}\n\n{p1_q_raw}"

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "1 ________ to direct the tunnelling", "blank": True}, "correctAnswer": "posts"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "water runs into a 2 ________ used by local people", "blank": True}, "correctAnswer": "canal"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "vertical shafts to remove earth and for 3 ________", "blank": True}, "correctAnswer": "ventilation"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "4 ________ made of wood or stone", "blank": True}, "correctAnswer": "lid"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "5 ________ attached to the plumb line", "blank": True}, "correctAnswer": "weight"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "handholds and footholds used for 6 ________", "blank": True}, "correctAnswer": "climbing"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "The counter-excavation method completely replaced the qanat method in the 6th century BCE.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "Only experienced builders were employed to construct a tunnel using the counter-excavation method.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "The information about a problem that occurred during the construction of the Saldae aqueduct system was found in an ancient book.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "The mistake made by the builders of the Saldae aqueduct system was that the two parts of the tunnel failed to meet.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "What type of mineral were the Dolaucothi mines in Wales built to extract?", "blank": True}, "correctAnswer": "gold"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "In addition to the patron, whose name might be carved onto a tunnel?", "blank": True}, "correctAnswer": "architect", "acceptableAnswers": ["architect", "the architect", "architect's name", "the architect's name"]},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "What part of Seleuceia Pieria was the Gevlik tunnel built to protect?", "blank": True}, "correctAnswer": "harbour", "acceptableAnswers": ["harbour", "harbor", "the harbour", "the harbor"]},
    ]

    # Passage 2
    p2_raw = clean_page(read_ocr("txt_test4", "p-11.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-12.txt"))
    p2_q_raw = clean_page(read_ocr("txt_test4", "p-13.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-14.txt"))
    p2_content = f"{p2_raw}\n\n{p2_q_raw}"

    screen_words_opts = [
        {"label": "A", "text": "fast"},
        {"label": "B", "text": "isolated"},
        {"label": "C", "text": "emotional"},
        {"label": "D", "text": "worrying"},
        {"label": "E", "text": "many"},
        {"label": "F", "text": "hard"},
        {"label": "G", "text": "combined"},
        {"label": "H", "text": "thorough"}
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer's main point in the first paragraph?", "options": [{"label": "A", "text": "Our use of technology is having a hidden effect on us."}, {"label": "B", "text": "Technology can be used to help youngsters to read."}, {"label": "C", "text": "Travellers should be encouraged to use technology on planes."}, {"label": "D", "text": "Playing games is a more popular use of technology than reading."}]}, "correctAnswer": "A"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What main point does Sherry Turkle make about innovation?", "options": [{"label": "A", "text": "Technological innovation has led to a reduction in print reading."}, {"label": "B", "text": "We should pay attention to what might be lost when innovation occurs."}, {"label": "C", "text": "We should encourage more young people to become involved in innovation."}, {"label": "D", "text": "There is a difference between developing products and developing ideas."}]}, "correctAnswer": "B"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point is the writer making in the fourth paragraph?", "options": [{"label": "A", "text": "Humans have an inborn ability to read and write."}, {"label": "B", "text": "Reading can be done using many different mediums."}, {"label": "C", "text": "Writing systems make unexpected demands on the brain."}, {"label": "D", "text": "Some brain circuits adjust to whatever is required of them."}]}, "correctAnswer": "D"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Mark Edmundson, the attitude of college students", "options": [{"label": "A", "text": "has changed the way he teaches."}, {"label": "B", "text": "has influenced what they select to read."}, {"label": "C", "text": "does not worry him as much as it does others."}, {"label": "D", "text": "does not match the views of the general public."}]}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "There have been many studies on digital screen use, showing some 18 ________ trends.", "options": screen_words_opts}, "correctAnswer": "D"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "to find out how 19 ________ each group’s understanding of the plot was.", "options": screen_words_opts}, "correctAnswer": "H"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "with those who read screens finding the order of information 20 ________ to recall.", "options": screen_words_opts}, "correctAnswer": "F"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "students are tending to read 21 ________ words and phrases in a text to save time.", "options": screen_words_opts}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "gives the reader a superficial understanding of the 22 ________ content of material", "options": screen_words_opts}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "The medium we use to read can affect our choice of reading content.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "Some age groups are more likely to lose their complex reading skills than others.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 25, "order": 24, "type": "TRUE_FALSE_NG", "content": {"stem": "False information has become more widespread in today’s digital era.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 26, "order": 25, "type": "TRUE_FALSE_NG", "content": {"stem": "We still have opportunities to rectify the problems that technology is presenting.", "options": ynng_opts}, "correctAnswer": "YES"},
    ]

    # Passage 3
    p3_q1_raw = clean_page(read_ocr("txt_test4", "p-15.txt"))
    p3_raw = clean_page(read_ocr("txt_test4", "p-16.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-17.txt"))
    p3_q2_raw = clean_page(read_ocr("txt_test4", "p-18.txt")) + "\n\n" + clean_page(read_ocr("txt_test4", "p-19.txt"))
    p3_content = f"{p3_q1_raw}\n\n{p3_raw}\n\n{p3_q2_raw}"

    headings_opts = [
        {"label": "i", "text": "An increasing divergence of attitudes towards AI"},
        {"label": "ii", "text": "Reasons why we have more faith in human judgement than in AI"},
        {"label": "iii", "text": "The superiority of AI projections over those made by humans"},
        {"label": "iv", "text": "The process by which AI can help us make good decisions"},
        {"label": "v", "text": "The advantages of involving users in AI processes"},
        {"label": "vi", "text": "Widespread distrust of an AI innovation"},
        {"label": "vii", "text": "Encouraging openness about how AI functions"},
        {"label": "viii", "text": "A surprisingly successful AI application"}
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Section A", "options": headings_opts}, "correctAnswer": "iii"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Section B", "options": headings_opts}, "correctAnswer": "vi"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Section C", "options": headings_opts}, "correctAnswer": "ii"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Section D", "options": headings_opts}, "correctAnswer": "i"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Section E", "options": headings_opts}, "correctAnswer": "vii"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "Section F", "options": headings_opts}, "correctAnswer": "v"},
        {"number": 33, "order": 32, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer doing in Section A?", "options": [{"label": "A", "text": "providing a solution to a concern"}, {"label": "B", "text": "justifying an opinion about an issue"}, {"label": "C", "text": "highlighting the existence of a problem"}, {"label": "D", "text": "explaining the reasons for a phenomenon"}]}, "correctAnswer": "C"},
        {"number": 34, "order": 33, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Section C, why might some people be reluctant to accept AI?", "options": [{"label": "A", "text": "They are afraid it will replace humans in decision-making jobs."}, {"label": "B", "text": "Its complexity makes them feel that they are at a disadvantage."}, {"label": "C", "text": "They would rather wait for the technology to be tested over a period of time."}, {"label": "D", "text": "Misunderstandings about how it works make it seem more challenging than it is."}]}, "correctAnswer": "B"},
        {"number": 35, "order": 34, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer say about the media in Section C of the text?", "options": [{"label": "A", "text": "It leads the public to be mistrustful of AI."}, {"label": "B", "text": "It devotes an excessive amount of attention to AI."}, {"label": "C", "text": "Its reports of incidents involving AI are often inaccurate."}, {"label": "D", "text": "It gives the impression that AI failures are due to designer error."}]}, "correctAnswer": "A"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Subjective depictions of AI in sci-fi films make people change their opinions about automation.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Portrayals of AI in media and entertainment are likely to become more positive.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "Rejection of the possibilities of AI may have a negative effect on many people’s lives.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "Familiarity with AI has very little impact on people’s attitudes to the technology.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "AI applications which users are able to modify are more likely to gain consumer approval.", "options": ynng_opts}, "correctAnswer": "YES"},
    ]

    return {
        "title": "Test 38.C16.04 - Reading",
        "slug": "test-38-reading",
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
    tests = [
        ("test-37-listening.json", build_test_37_listening()),
        ("test-37-reading.json", build_test_37_reading()),
        ("test-38-listening.json", build_test_38_listening()),
        ("test-38-reading.json", build_test_38_reading()),
    ]
    for filename, test_data in tests:
        out_path = os.path.join(TESTS_DIR, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(test_data, f, indent=2, ensure_ascii=False)
        print(f"Generated {out_path} ({len(test_data['parts'])} parts, {sum(len(p['questions']) for p in test_data['parts'])} questions)")

if __name__ == "__main__":
    main()
