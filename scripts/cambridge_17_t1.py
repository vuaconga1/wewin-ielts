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

def get_test_39():
    # ==================== LISTENING ====================
    s1_content = clean_page(read_page(10))
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "making sure the beach does not have 1 ________ on it", "blank": True}, "correctAnswer": "litter"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "no 2 ________ to the place", "blank": True}, "correctAnswer": "dogs"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "next task is taking action to attract 3 ________", "blank": True}, "correctAnswer": "insects"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "identifying types of 4 ________", "blank": True}, "correctAnswer": "butterflies"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "building a new 5 ________", "blank": True}, "correctAnswer": "wall"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "walk across the sands and reach the 6 ________", "blank": True}, "correctAnswer": "island"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "wear appropriate 7 ________", "blank": True}, "correctAnswer": "boots"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "suitable for 8 ________ to participate in", "blank": True}, "correctAnswer": "beginners"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "making 9 ________ out of wood", "blank": True}, "correctAnswer": "spoons"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "cost of session (no camping): 10 £ ________", "blank": True}, "correctAnswer": "35", "acceptableAnswers": ["35", "thirty five", "thirty-five", "£35"]},
    ]

    s2_content = clean_page(read_page(11)) + "\n\n" + clean_page(read_page(12))
    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the maximum number of people who can stand on each side of the boat?", "options": [{"label": "A", "text": "9"}, {"label": "B", "text": "15"}, {"label": "C", "text": "18"}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What colour are the tour boats?", "options": [{"label": "A", "text": "dark red"}, {"label": "B", "text": "jet black"}, {"label": "C", "text": "light green"}]}, "correctAnswer": "C"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which lunchbox is suitable for someone who doesn’t eat meat or fish?", "options": [{"label": "A", "text": "Lunchbox 1"}, {"label": "B", "text": "Lunchbox 2"}, {"label": "C", "text": "Lunchbox 3"}]}, "correctAnswer": "B"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What should people do with their litter?", "options": [{"label": "A", "text": "take it home"}, {"label": "B", "text": "hand it to a member of staff"}, {"label": "C", "text": "put it in the bins provided on the boat"}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO features of the lighthouse does Lou mention? (Option 1)", "options": [{"label": "A", "text": "why it was built"}, {"label": "B", "text": "who built it"}, {"label": "C", "text": "how long it took to build"}, {"label": "D", "text": "who staffed it"}, {"label": "E", "text": "what it was built with"}]}, "correctAnswer": "A", "acceptableAnswers": ["A", "D"]},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO features of the lighthouse does Lou mention? (Option 2)", "options": [{"label": "A", "text": "why it was built"}, {"label": "B", "text": "who built it"}, {"label": "C", "text": "how long it took to build"}, {"label": "D", "text": "who staffed it"}, {"label": "E", "text": "what it was built with"}]}, "correctAnswer": "D", "acceptableAnswers": ["A", "D"]},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO types of creature might come close to the boat? (Option 1)", "options": [{"label": "A", "text": "sea eagles"}, {"label": "B", "text": "fur seals"}, {"label": "C", "text": "dolphins"}, {"label": "D", "text": "whales"}, {"label": "E", "text": "penguins"}]}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO types of creature might come close to the boat? (Option 2)", "options": [{"label": "A", "text": "sea eagles"}, {"label": "B", "text": "fur seals"}, {"label": "C", "text": "dolphins"}, {"label": "D", "text": "whales"}, {"label": "E", "text": "penguins"}]}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Lou make about the caves? (Option 1)", "options": [{"label": "A", "text": "Only large tourist boats can visit them."}, {"label": "B", "text": "The entrances to them are often blocked."}, {"label": "C", "text": "It is too dangerous for individuals to go near them."}, {"label": "D", "text": "Someone will explain what is inside them."}, {"label": "E", "text": "They cannot be reached on foot."}]}, "correctAnswer": "D", "acceptableAnswers": ["D", "E"]},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Lou make about the caves? (Option 2)", "options": [{"label": "A", "text": "Only large tourist boats can visit them."}, {"label": "B", "text": "The entrances to them are often blocked."}, {"label": "C", "text": "It is too dangerous for individuals to go near them."}, {"label": "D", "text": "Someone will explain what is inside them."}, {"label": "E", "text": "They cannot be reached on foot."}]}, "correctAnswer": "E", "acceptableAnswers": ["D", "E"]},
    ]

    s3_content = clean_page(read_page(13)) + "\n\n" + clean_page(read_page(14))
    module_opinions = [
        {"label": "A", "text": "Tim found this easier than expected."},
        {"label": "B", "text": "Tim thought this was not very clearly organised."},
        {"label": "C", "text": "Diana may do some further study on this."},
        {"label": "D", "text": "They both found the reading required for this was difficult."},
        {"label": "E", "text": "Tim was shocked at something he learned on this module."},
        {"label": "F", "text": "They were both surprised how little is known about some aspects of this."}
    ]
    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "What problem did both Diana and Tim have when arranging their work experience?", "options": [{"label": "A", "text": "making initial contact with suitable farms"}, {"label": "B", "text": "organising transport to and from the farm"}, {"label": "C", "text": "finding a placement for the required length of time"}]}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Tim was pleased to be able to help", "options": [{"label": "A", "text": "a lamb that had a broken leg."}, {"label": "B", "text": "a sheep that was having difficulty giving birth."}, {"label": "C", "text": "a newly born lamb that was having trouble feeding."}]}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Diana says the sheep on her farm", "options": [{"label": "A", "text": "were of various different varieties."}, {"label": "B", "text": "were mainly reared for their meat."}, {"label": "C", "text": "had better quality wool than sheep on the hills."}]}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "What did the students learn about adding supplements to chicken feed?", "options": [{"label": "A", "text": "These should only be given if specially needed."}, {"label": "B", "text": "It is worth paying extra for the most effective ones."}, {"label": "C", "text": "The amount given at one time should be limited."}]}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "What happened when Diana was working with dairy cows?", "options": [{"label": "A", "text": "She identified some cows incorrectly."}, {"label": "B", "text": "She accidentally threw some milk away."}, {"label": "C", "text": "She made a mistake when storing milk."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "What did both farmers mention about vets and farming?", "options": [{"label": "A", "text": "Vets are failing to cope with some aspects of animal health."}, {"label": "B", "text": "There needs to be a fundamental change in the training of vets."}, {"label": "C", "text": "Some jobs could be done by the farmer rather than by a vet."}]}, "correctAnswer": "C"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Medical terminology", "options": module_opinions}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Diet and nutrition", "options": module_opinions}, "correctAnswer": "E"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Animal disease", "options": module_opinions}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Wildlife medication", "options": module_opinions}, "correctAnswer": "C"},
    ]

    s4_content = clean_page(read_page(15))
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "Mazes are a type of 31 ________", "blank": True}, "correctAnswer": "puzzle"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "32 ________ is needed to navigate through a maze", "blank": True}, "correctAnswer": "logic"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "the word ‘maze’ is derived from a word meaning a feeling of 33 ________", "blank": True}, "correctAnswer": "confusion"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "they have frequently been used in 34 ________ and prayer", "blank": True}, "correctAnswer": "meditation"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Ancient carvings on 35 ________ have been found across many cultures", "blank": True}, "correctAnswer": "stone"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Ancient Greeks used the symbol on 36 ________", "blank": True}, "correctAnswer": "coins"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The largest surviving example of a turf labyrinth once had a big 37 ________ at its centre", "blank": True}, "correctAnswer": "tree"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "walking a maze can reduce a person’s 38 ________ rate", "blank": True}, "correctAnswer": "breathing"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "patients who can’t walk can use ‘finger labyrinths’ made from 39 ________", "blank": True}, "correctAnswer": "paper"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "research has shown that Alzheimer’s sufferers experience less 40 ________", "blank": True}, "correctAnswer": "anxiety"},
    ]

    listening_test = {
        "title": "Test 39.C17.01 - Listening",
        "slug": "test-39-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "sourceFolder": "Cambridge IELTS 17 PDF.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": s1_content, "questions": s1_questions, "meta": {"audioUrl": "/uploads/audio/test-39-section-1.mp3"}},
            {"order": 1, "title": "Part 2", "content": s2_content, "questions": s2_questions, "meta": {"audioUrl": "/uploads/audio/test-39-section-2.mp3"}},
            {"order": 2, "title": "Part 3", "content": s3_content, "questions": s3_questions, "meta": {"audioUrl": "/uploads/audio/test-39-section-3.mp3"}},
            {"order": 3, "title": "Part 4", "content": s4_content, "questions": s4_questions, "meta": {"audioUrl": "/uploads/audio/test-39-section-4.mp3"}},
        ]
    }

    # ==================== READING ====================
    p1_content = clean_page(read_page(16)) + "\n\n" + clean_page(read_page(17)) + "\n\n" + clean_page(read_page(18)) + "\n\n" + clean_page(read_page(19))
    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "The 1 ________ of London increased rapidly between 1800 and 1850", "blank": True}, "correctAnswer": "population"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "make it possible to move people to better housing in the 2 ________", "blank": True}, "correctAnswer": "suburbs"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "A number of 3 ________ agreed with Pearson’s idea", "blank": True}, "correctAnswer": "businessmen"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "The company initially had problems getting the 4 ________ needed for the project", "blank": True}, "correctAnswer": "funding"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Negative articles about the project appeared in the 5 ________", "blank": True}, "correctAnswer": "press"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "With the completion of the brick arch, the tunnel was covered with 6 ________", "blank": True}, "correctAnswer": "soil"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "Other countries had built underground railways before the Metropolitan line opened.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "More people than predicted travelled on the Metropolitan line on the first day.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "The use of ventilation shafts failed to prevent pollution in the tunnels.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "A different approach from the ‘cut and cover’ technique was required in London’s central area.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "The windows on City & South London trains were at eye level.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "The City & South London Railway was a financial success.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Trains on the ‘Tuppenny Tube’ nearly always ran on time.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_content = clean_page(read_page(20)) + "\n\n" + clean_page(read_page(21)) + "\n\n" + clean_page(read_page(22)) + "\n\n" + clean_page(read_page(23))
    sec_opts_7 = [{"label": c, "text": f"Section {c}"} for c in "ABCDEFG"]
    twentieth_stadiums_opts = [
        {"label": "A", "text": "They are less imaginatively designed."},
        {"label": "B", "text": "They are less spacious."},
        {"label": "C", "text": "They are in less convenient locations."},
        {"label": "D", "text": "They are less versatile."},
        {"label": "E", "text": "They are made of less durable materials."}
    ]
    modern_stadiums_opts = [
        {"label": "A", "text": "offering improved amenities for the enjoyment of sports events"},
        {"label": "B", "text": "bringing community life back into the city environment"},
        {"label": "C", "text": "facilitating research into solar and wind energy solutions"},
        {"label": "D", "text": "enabling local residents to reduce their consumption of electricity"},
        {"label": "E", "text": "providing a suitable site for the installation of renewable power generators"}
    ]
    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "a mention of negative attitudes towards stadium building projects", "options": sec_opts_7}, "correctAnswer": "A"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "figures demonstrating the environmental benefits of a certain stadium", "options": sec_opts_7}, "correctAnswer": "F"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "examples of the wide range of facilities available at some new stadiums", "options": sec_opts_7}, "correctAnswer": "E"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "reference to the disadvantages of the stadiums built during a certain era", "options": sec_opts_7}, "correctAnswer": "D"},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "The amphitheatre of Arles, for example, was converted first into a 18 ________", "blank": True}, "correctAnswer": "fortress"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "and finally into an arena where spectators could watch 19 ________ .", "blank": True}, "correctAnswer": "bullfights"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "is famous today as a venue where 20 ________ is performed.", "blank": True}, "correctAnswer": "opera"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "including the storage of 21 ________ .", "blank": True}, "correctAnswer": "salt"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "It is now a market square with 22 ________ and homes incorporated", "blank": True}, "correctAnswer": "shops"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "which TWO negative features does the writer mention? (Option 1)", "options": twentieth_stadiums_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "D"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "which TWO negative features does the writer mention? (Option 2)", "options": twentieth_stadiums_opts}, "correctAnswer": "D", "acceptableAnswers": ["C", "D"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO advantages of modern stadium design does the writer mention? (Option 1)", "options": modern_stadiums_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO advantages of modern stadium design does the writer mention? (Option 2)", "options": modern_stadiums_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
    ]

    p3_content = clean_page(read_page(24)) + "\n\n" + clean_page(read_page(25)) + "\n\n" + clean_page(read_page(26)) + "\n\n" + clean_page(read_page(27))
    phrases_opts = [
        {"label": "A", "text": "military innovation"},
        {"label": "B", "text": "large reward"},
        {"label": "C", "text": "widespread conspiracy"},
        {"label": "D", "text": "relative safety"},
        {"label": "E", "text": "new government"},
        {"label": "F", "text": "decisive victory"},
        {"label": "G", "text": "political debate"},
        {"label": "H", "text": "strategic alliance"},
        {"label": "I", "text": "popular solution"},
        {"label": "J", "text": "religious conviction"}
    ]
    ynng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Charles II then formed a 27 ________ with the Scots,", "options": phrases_opts}, "correctAnswer": "H"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "he abandoned an important 28 ________ that was held by his father", "options": phrases_opts}, "correctAnswer": "J"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "The battle led to a 29 ________ for the Parliamentarians", "options": phrases_opts}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "A 30 ________ was offered for Charles’s capture,", "options": phrases_opts}, "correctAnswer": "B"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "he eventually managed to reach the 31 ________ of continental Europe.", "options": phrases_opts}, "correctAnswer": "D"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "Charles chose Pepys for the task because he considered him to be trustworthy.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "Charles’s personal recollection of the escape lacked sufficient detail.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "Charles indicated to Pepys that he had planned his escape before the battle.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "The inclusion of Charles’s account is a positive aspect of the book.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 36, "order": 35, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the reviewer’s main purpose in the first paragraph?", "options": [{"label": "A", "text": "to describe what happened during the Battle of Worcester"}, {"label": "B", "text": "to give an account of the circumstances leading to Charles II’s escape"}, {"label": "C", "text": "to provide details of the Parliamentarians’ political views"}, {"label": "D", "text": "to compare Charles II’s beliefs with those of his father"}]}, "correctAnswer": "B"},
        {"number": 37, "order": 36, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why does the reviewer include examples of the fugitives’ behaviour in the third paragraph?", "options": [{"label": "A", "text": "to explain how close Charles II came to losing his life"}, {"label": "B", "text": "to suggest that Charles II’s supporters were badly prepared"}, {"label": "C", "text": "to illustrate how the events of the six weeks are brought to life"}, {"label": "D", "text": "to argue that certain aspects are not as well known as they should be"}]}, "correctAnswer": "C"},
        {"number": 38, "order": 37, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the reviewer make about Charles II in the fourth paragraph?", "options": [{"label": "A", "text": "He chose to celebrate what was essentially a defeat."}, {"label": "B", "text": "He misunderstood the motives of his opponents."}, {"label": "C", "text": "He aimed to restore people’s faith in the monarchy."}, {"label": "D", "text": "He was driven by a desire to be popular."}]}, "correctAnswer": "A"},
        {"number": 39, "order": 38, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the reviewer say about Charles Spencer in the fifth paragraph?", "options": [{"label": "A", "text": "His decision to write the book comes as a surprise."}, {"label": "B", "text": "He takes an unbiased approach to the subject matter."}, {"label": "C", "text": "His descriptions of events would be better if they included more detail."}, {"label": "D", "text": "He chooses language that is suitable for a twenty-first-century audience."}]}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MULTIPLE_CHOICE", "content": {"stem": "When the reviewer says the book ‘doesn’t quite hit the mark’, she is making the point that", "options": [{"label": "A", "text": "it overlooks the impact of events on ordinary people."}, {"label": "B", "text": "it lacks an analysis of prevalent views on monarchy."}, {"label": "C", "text": "it omits any references to the deceit practised by Charles II during his time in hiding."}, {"label": "D", "text": "it fails to address whether Charles II’s experiences had a lasting influence on him."}]}, "correctAnswer": "D"},
    ]

    reading_test = {
        "title": "Test 39.C17.01 - Reading",
        "slug": "test-39-reading",
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
