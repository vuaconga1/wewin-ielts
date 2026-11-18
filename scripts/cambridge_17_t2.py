import os
import re
from datetime import datetime, timezone

TEXT_DIR = "/home/wewin/.gemini/antigravity/brain/8816dbd8-e084-486e-bc54-de0314835e15/scratch/c17_text"

def read_page(p_num):
    p = os.path.join(TEXT_DIR, f"p_{p_num:03d}.txt")
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
        if re.match(r"^\d{1,3}$", l):
            continue
        if re.match(r"^.*p\.\s*\d+.*$", l) and ("p." in l and len(l) < 30):
            continue
        cleaned.append(line)
    return "\n".join(cleaned).strip()

def get_test_40():
    # ==================== LISTENING ====================
    s1_content = clean_page(read_page(31))
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Help with 1 ________ books (times to be arranged)", "blank": True}, "correctAnswer": "collecting"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Help needed to keep 2 ________ of books up to date", "blank": True}, "correctAnswer": "records"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Library is in the 3 ________ Room in the village hall", "blank": True}, "correctAnswer": "West"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Help by providing 4 ________", "blank": True}, "correctAnswer": "transport"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Help with hobbies such as 5 ________", "blank": True}, "correctAnswer": "art"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Taking Mrs Carroll to 6 ________", "blank": True}, "correctAnswer": "hospital"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Work in the 7 ________ at Mr Selsbury’s house", "blank": True}, "correctAnswer": "garden"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "19 Oct Event: 8 ________", "blank": True}, "correctAnswer": "quiz"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "18 Nov: checking 9 ________", "blank": True}, "correctAnswer": "tickets"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "31 Dec: designing the 10 ________", "blank": True}, "correctAnswer": "poster"},
    ]

    s2_content = clean_page(read_page(32)) + "\n\n" + clean_page(read_page(33))
    farm_activities = [
        {"label": "A", "text": "shopping"},
        {"label": "B", "text": "watching cows being milked"},
        {"label": "C", "text": "seeing old farming equipment"},
        {"label": "D", "text": "eating and drinking"},
        {"label": "E", "text": "starting a trip"},
        {"label": "F", "text": "seeing rare breeds of animals"},
        {"label": "G", "text": "helping to look after animals"},
        {"label": "H", "text": "using farming tools"}
    ]
    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Many past owners made changes to", "options": [{"label": "A", "text": "the gardens."}, {"label": "B", "text": "the house."}, {"label": "C", "text": "the farm."}]}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Sir Edward Downes built Oniton Hall because he wanted", "options": [{"label": "A", "text": "a place for discussing politics."}, {"label": "B", "text": "a place to display his wealth."}, {"label": "C", "text": "a place for artists and writers."}]}, "correctAnswer": "C"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Visitors can learn about the work of servants in the past from", "options": [{"label": "A", "text": "audio guides."}, {"label": "B", "text": "photographs."}, {"label": "C", "text": "people in costume."}]}, "correctAnswer": "C"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is new for children at Oniton Hall?", "options": [{"label": "A", "text": "clothes for dressing up"}, {"label": "B", "text": "mini tractors"}, {"label": "C", "text": "the adventure playground"}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "dairy", "options": farm_activities}, "correctAnswer": "D"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "large barn", "options": farm_activities}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "small barn", "options": farm_activities}, "correctAnswer": "G"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "stables", "options": farm_activities}, "correctAnswer": "A"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "shed", "options": farm_activities}, "correctAnswer": "E"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "parkland", "options": farm_activities}, "correctAnswer": "F"},
    ]

    s3_content = clean_page(read_page(34)) + "\n\n" + clean_page(read_page(35))
    rj_include_opts = [
        {"label": "A", "text": "analysis of the text"},
        {"label": "B", "text": "a summary of the plot"},
        {"label": "C", "text": "a description of the theatre"},
        {"label": "D", "text": "a personal reaction"},
        {"label": "E", "text": "a reference to particular scenes"}
    ]
    prod_opinions = [
        {"label": "A", "text": "They both expected this to be more traditional."},
        {"label": "B", "text": "They both thought this was original."},
        {"label": "C", "text": "They agree this created the right atmosphere."},
        {"label": "D", "text": "They agree this was a major strength."},
        {"label": "E", "text": "They were both disappointed by this."},
        {"label": "F", "text": "They disagree about why this was an issue."},
        {"label": "G", "text": "They disagree about how this could be improved."}
    ]
    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students agree they need to include in their reviews of Romeo and Juliet? (Option 1)", "options": rj_include_opts}, "correctAnswer": "D", "acceptableAnswers": ["D", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students agree they need to include in their reviews of Romeo and Juliet? (Option 2)", "options": rj_include_opts}, "correctAnswer": "E", "acceptableAnswers": ["D", "E"]},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "the set", "options": prod_opinions}, "correctAnswer": "D"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "the lighting", "options": prod_opinions}, "correctAnswer": "C"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "the costume design", "options": prod_opinions}, "correctAnswer": "A"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "the music", "options": prod_opinions}, "correctAnswer": "E"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "the actors’ delivery", "options": prod_opinions}, "correctAnswer": "F"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students think the story of Romeo and Juliet is still relevant for young people today because", "options": [{"label": "A", "text": "it illustrates how easily conflict can start."}, {"label": "B", "text": "it deals with problems that families experience."}, {"label": "C", "text": "it teaches them about relationships."}]}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students found watching Romeo and Juliet in another language", "options": [{"label": "A", "text": "frustrating."}, {"label": "B", "text": "demanding."}, {"label": "C", "text": "moving."}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why do the students think Shakespeare’s plays have such international appeal?", "options": [{"label": "A", "text": "The stories are exciting."}, {"label": "B", "text": "There are recognisable characters."}, {"label": "C", "text": "They can be interpreted in many ways."}]}, "correctAnswer": "C"},
    ]

    s4_content = clean_page(read_page(36))
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "has approximately 31 ________ speakers", "blank": True}, "correctAnswer": "321,000", "acceptableAnswers": ["321,000", "321000"]},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "has a 32 ________ that is still growing", "blank": True}, "correctAnswer": "vocabulary"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "such as web browser and 33 ________", "blank": True}, "correctAnswer": "podcast"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "are big users of digital technology, such as 34 ________", "blank": True}, "correctAnswer": "smartphones"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "are becoming 35 ________ very quickly", "blank": True}, "correctAnswer": "bilingual"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "while they are in the 36 ________ at school", "blank": True}, "correctAnswer": "playground"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "identify the content of a 37 ________ in English than Icelandic", "blank": True}, "correctAnswer": "picture"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "because of how complicated its 38 ________ is", "blank": True}, "correctAnswer": "grammar"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "is worried that young Icelanders may lose their 39 ________ as Icelanders", "blank": True}, "correctAnswer": "identity"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "worried about the consequences of children not being 40 ________ in either Icelandic or English", "blank": True}, "correctAnswer": "fluent"},
    ]

    listening_test = {
        "title": "Test 40.C17.02 - Listening",
        "slug": "test-40-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "Cambridge IELTS 17 PDF.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": s1_content, "questions": s1_questions, "meta": {"audioUrl": "/uploads/audio/test-40-section-1.mp3"}},
            {"order": 1, "title": "Part 2", "content": s2_content, "questions": s2_questions, "meta": {"audioUrl": "/uploads/audio/test-40-section-2.mp3"}},
            {"order": 2, "title": "Part 3", "content": s3_content, "questions": s3_questions, "meta": {"audioUrl": "/uploads/audio/test-40-section-3.mp3"}},
            {"order": 3, "title": "Part 4", "content": s4_content, "questions": s4_questions, "meta": {"audioUrl": "/uploads/audio/test-40-section-4.mp3"}},
        ]
    }

    # ==================== READING ====================
    p1_content = clean_page(read_page(37)) + "\n\n" + clean_page(read_page(38)) + "\n\n" + clean_page(read_page(39)) + "\n\n" + clean_page(read_page(40))
    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "heard a noise of breaking when one teenager threw a 1 ________", "blank": True}, "correctAnswer": "rock"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "teenagers went into the 2 ________", "blank": True}, "correctAnswer": "cave"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "found a number of containers made of 3 ________", "blank": True}, "correctAnswer": "clay"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "thought to have been written by group of people known as the 4 ________", "blank": True}, "correctAnswer": "Essenes"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "written mainly in the 5 ________ language", "blank": True}, "correctAnswer": "Hebrew"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "The Bedouin teenagers who found the scrolls were disappointed by how little money they received for them.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "There is agreement among academics about the origin of the Dead Sea Scrolls.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "Most of the books of the Bible written on the scrolls are incomplete.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "The information on the Copper Scroll is written in an unusual way.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Mar Samuel was given some of the scrolls as a gift.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "In the early 1950s, a number of educational establishments in the US were keen to buy scrolls from Mar Samuel.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "The scroll that was pieced together in 2017 contains information about annual occasions in the Qumran area 2,000 years ago.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Academics at the University of Haifa are currently researching how to decipher the final scroll.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_content = clean_page(read_page(41)) + "\n\n" + clean_page(read_page(42)) + "\n\n" + clean_page(read_page(43)) + "\n\n" + clean_page(read_page(44))
    sec_opts_5 = [{"label": c, "text": f"Section {c}"} for c in "ABCDE"]
    researchers_opts = [
        {"label": "A", "text": "Jorg Kudla"},
        {"label": "B", "text": "Caixia Gao"},
        {"label": "C", "text": "Joyce Van Eck"},
        {"label": "D", "text": "Jonathan Jones"}
    ]
    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "a reference to a type of tomato that can resist a dangerous infection", "options": sec_opts_5}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "an explanation of how problems can arise from focusing only on a certain type of tomato plant.", "options": sec_opts_5}, "correctAnswer": "B"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "a number of examples of plants that are not cultivated at present but could be useful as food sources", "options": sec_opts_5}, "correctAnswer": "E"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a comparison between the early domestication of the tomato and more recent research", "options": sec_opts_5}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "a personal reaction to the flavour of a tomato that has been genetically edited", "options": sec_opts_5}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Domestication of certain plants could allow them to adapt to future environmental challenges.", "options": researchers_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "The idea of growing and eating unusual plants may not be accepted on a large scale.", "options": researchers_opts}, "correctAnswer": "D"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "It is not advisable for the future direction of certain research to be made public.", "options": researchers_opts}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "Present efforts to domesticate one wild fruit are limited by the costs involved.", "options": researchers_opts}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "Humans only make use of a small proportion of the plant food available on Earth.", "options": researchers_opts}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "An undesirable trait such as loss of 24 ________ may be caused by a mutation in a tomato gene.", "blank": True}, "correctAnswer": "flavour", "acceptableAnswers": ["flavour", "flavor"]},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "researchers made the tomato three times its original 25 ________ .", "blank": True}, "correctAnswer": "size"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "tomato which was not badly affected by 26 ________ , and was rich in vitamin C", "blank": True}, "correctAnswer": "salt"},
    ]

    p3_content = clean_page(read_page(45)) + "\n\n" + clean_page(read_page(46)) + "\n\n" + clean_page(read_page(47)) + "\n\n" + clean_page(read_page(48)) + "\n\n" + clean_page(read_page(49))
    ynng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    creative_words_opts = [
        {"label": "A", "text": "invention"},
        {"label": "B", "text": "goals"},
        {"label": "C", "text": "compromise"},
        {"label": "D", "text": "mistakes"},
        {"label": "E", "text": "luck"},
        {"label": "F", "text": "inspiration"},
        {"label": "G", "text": "experiments"}
    ]
    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "The purpose of the first paragraph is to", "options": [{"label": "A", "text": "defend particular ideas."}, {"label": "B", "text": "compare certain beliefs."}, {"label": "C", "text": "disprove a widely held view."}, {"label": "D", "text": "outline a common assumption."}]}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are the writers doing in the second paragraph?", "options": [{"label": "A", "text": "criticising an opinion"}, {"label": "B", "text": "justifying a standpoint"}, {"label": "C", "text": "explaining an approach"}, {"label": "D", "text": "supporting an argument"}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the third paragraph, what do the writers suggest about Darwin and Einstein?", "options": [{"label": "A", "text": "They represent an exception to a general rule."}, {"label": "B", "text": "Their way of working has been misunderstood."}, {"label": "C", "text": "They are an ideal which others should aspire to."}, {"label": "D", "text": "Their achievements deserve greater recognition."}]}, "correctAnswer": "A"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "John Nicholson is an example of a person whose idea", "options": [{"label": "A", "text": "established his reputation as an influential scientist."}, {"label": "B", "text": "was only fully understood at a later point in history."}, {"label": "C", "text": "laid the foundations for someone else’s breakthrough."}, {"label": "D", "text": "initially met with scepticism from the scientific community."}]}, "correctAnswer": "C"},
        {"number": 31, "order": 30, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the key point of interest about the ‘acey-deucy’ stirrup placement?", "options": [{"label": "A", "text": "the simple reason why it was invented"}, {"label": "B", "text": "the enthusiasm with which it was adopted"}, {"label": "C", "text": "the research that went into its development"}, {"label": "D", "text": "the cleverness of the person who first used it"}]}, "correctAnswer": "A"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "Acknowledging people such as Plato or da Vinci as geniuses will help us understand the process by which great minds create new ideas.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "The Law of Effect was discovered at a time when psychologists were seeking a scientific reason why creativity occurs.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "The Law of Effect states that no planning is involved in the behaviour of organisms.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "The Law of Effect sets out clear explanations about the sources of new ideas and behaviours.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Many scientists are now turning away from the notion of intelligent design and genius.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "breakthroughs happen when a single great mind has sudden 37 ________ .", "options": creative_words_opts}, "correctAnswer": "F"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "In some cases, this process involves 38 ________ ,", "options": creative_words_opts}, "correctAnswer": "D"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "There is also often an element of 39 ________ ,", "options": creative_words_opts}, "correctAnswer": "E"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "there may be no clear 40 ________ involved,", "options": creative_words_opts}, "correctAnswer": "B"},
    ]

    reading_test = {
        "title": "Test 40.C17.02 - Reading",
        "slug": "test-40-reading",
        "skill": "READING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "Cambridge IELTS 17 PDF.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Reading Passage 1", "content": p1_content, "questions": p1_questions},
            {"order": 1, "title": "Reading Passage 2", "content": p2_content, "questions": p2_questions},
            {"order": 2, "title": "Reading Passage 3", "content": p3_content, "questions": p3_questions},
        ]
    }

    return listening_test, reading_test

