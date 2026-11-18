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

def get_test_42():
    # ==================== LISTENING ====================
    s1_content = clean_page(read_page(75))
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Cleaning the 1 ________ throughout the apartment", "blank": True}, "correctAnswer": "floor", "acceptableAnswers": ["floor", "floors"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Cleaning the 2 ________", "blank": True}, "correctAnswer": "fridge"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Ironing clothes – 3 ________ only", "blank": True}, "correctAnswer": "shirts"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Cleaning all the 4 ________ from the inside", "blank": True}, "correctAnswer": "windows"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Washing down the 5 ________", "blank": True}, "correctAnswer": "balcony"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "They can organise a plumber or an 6 ________ if necessary.", "blank": True}, "correctAnswer": "electrician"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "A special cleaning service is available for customers who are allergic to 7 ________ .", "blank": True}, "correctAnswer": "dust"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "all cleaners have a background check carried out by the 8 ________ .", "blank": True}, "correctAnswer": "police"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "All cleaners are given 9 ________ for two weeks.", "blank": True}, "correctAnswer": "training"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Customers send a 10 ________ after each visit.", "blank": True}, "correctAnswer": "review"},
    ]

    s2_content = clean_page(read_page(76)) + "\n\n" + clean_page(read_page(77))
    turnover_opts = [
        {"label": "A", "text": "improving relationships and teamwork"},
        {"label": "B", "text": "offering incentives and financial benefits"},
        {"label": "C", "text": "providing career opportunities"}
    ]
    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Many hotel managers are unaware that their staff often leave because of", "options": [{"label": "A", "text": "a lack of training."}, {"label": "B", "text": "long hours."}, {"label": "C", "text": "low pay."}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the impact of high staff turnover on managers?", "options": [{"label": "A", "text": "an increased workload"}, {"label": "B", "text": "low morale"}, {"label": "C", "text": "an inability to meet targets"}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "What mistake should managers always avoid?", "options": [{"label": "A", "text": "failing to treat staff equally"}, {"label": "B", "text": "reorganising shifts without warning"}, {"label": "C", "text": "neglecting to have enough staff during busy periods"}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What unexpected benefit did Dunwich Hotel notice after improving staff retention rates?", "options": [{"label": "A", "text": "a fall in customer complaints"}, {"label": "B", "text": "an increase in loyalty club membership"}, {"label": "C", "text": "a rise in spending per customer"}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "The Sun Club", "options": turnover_opts}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "The Portland", "options": turnover_opts}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Bluewater Hotels", "options": turnover_opts}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Pentlow Hotels", "options": turnover_opts}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Green Planet", "options": turnover_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "The Amesbury", "options": turnover_opts}, "correctAnswer": "A"},
    ]

    s3_content = clean_page(read_page(78)) + "\n\n" + clean_page(read_page(79))
    sport_comments_opts = [
        {"label": "A", "text": "It could cause excessive sweating."},
        {"label": "B", "text": "The material was being mass produced for another purpose."},
        {"label": "C", "text": "People often needed to make their own."},
        {"label": "D", "text": "It often had to be replaced."},
        {"label": "E", "text": "The material was expensive."},
        {"label": "F", "text": "It was unpopular among spectators."},
        {"label": "G", "text": "It caused injuries."},
        {"label": "H", "text": "No one using it liked it at first."}
    ]
    sporting_activities_opts = [
        {"label": "A", "text": "He should have felt more positive about them."},
        {"label": "B", "text": "The training was too challenging for him."},
        {"label": "C", "text": "He could have worked harder at them."},
        {"label": "D", "text": "His parents were disappointed in him."},
        {"label": "E", "text": "His fellow students admired him."}
    ]
    feelings_kenya_opts = [
        {"label": "A", "text": "disbelief"},
        {"label": "B", "text": "relief"},
        {"label": "C", "text": "stress"},
        {"label": "D", "text": "gratitude"},
        {"label": "E", "text": "homesickness"}
    ]
    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points do Thomas and Jeanne make about Thomas’s sporting activities at school? (Option 1)", "options": sporting_activities_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points do Thomas and Jeanne make about Thomas’s sporting activities at school? (Option 2)", "options": sporting_activities_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO feelings did Thomas experience when he was in Kenya? (Option 1)", "options": feelings_kenya_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "D"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO feelings did Thomas experience when he was in Kenya? (Option 2)", "options": feelings_kenya_opts}, "correctAnswer": "D", "acceptableAnswers": ["A", "D"]},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "the table tennis bat", "options": sport_comments_opts}, "correctAnswer": "B"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "the cricket helmet", "options": sport_comments_opts}, "correctAnswer": "F"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "the cycle helmet", "options": sport_comments_opts}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "the golf club", "options": sport_comments_opts}, "correctAnswer": "D"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "the hockey stick", "options": sport_comments_opts}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "the football", "options": sport_comments_opts}, "correctAnswer": "G"},
    ]

    s4_content = clean_page(read_page(80))
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "colour described as 31 ________", "blank": True}, "correctAnswer": "golden"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "very 32 ________ compared to refined sugar", "blank": True}, "correctAnswer": "healthy"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "best growing conditions and 33 ________ are in Canada and North America", "blank": True}, "correctAnswer": "climate"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "used hot 34 ________ to heat the sap", "blank": True}, "correctAnswer": "rock", "acceptableAnswers": ["rock", "rocks"]},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Tree trunks may not have the correct 35 ________ until they have been growing for 40 years.", "blank": True}, "correctAnswer": "diameter"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "A tap is drilled into the trunk and a 36 ________ carries the sap into a bucket.", "blank": True}, "correctAnswer": "tube"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Large pans of sap called evaporators are heated by means of a 37 ________ .", "blank": True}, "correctAnswer": "fire"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "A lot of 38 ________ is produced during the evaporation process.", "blank": True}, "correctAnswer": "steam"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "‘Sugar sand’ is removed because it makes the syrup look 39 ________ and affects the taste.", "blank": True}, "correctAnswer": "cloudy"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "A huge quantity of sap is needed to make a 40 ________ of maple syrup.", "blank": True}, "correctAnswer": "litre", "acceptableAnswers": ["litre", "liter"]},
    ]

    listening_test = {
        "title": "Test 42.C17.04 - Listening",
        "slug": "test-42-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "audioUrl": "/uploads/audio/test-42-section-1.mp3",
        "sourceFolder": "Cambridge IELTS 17 PDF.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": s1_content, "audioUrl": "/uploads/audio/test-42-section-1.mp3", "questions": s1_questions},
            {"order": 1, "title": "Part 2", "content": s2_content, "audioUrl": "/uploads/audio/test-42-section-2.mp3", "questions": s2_questions},
            {"order": 2, "title": "Part 3", "content": s3_content, "audioUrl": "/uploads/audio/test-42-section-3.mp3", "questions": s3_questions},
            {"order": 3, "title": "Part 4", "content": s4_content, "audioUrl": "/uploads/audio/test-42-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = clean_page(read_page(81)) + "\n\n" + clean_page(read_page(82))
    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "Many Madagascan forests are being destroyed by attacks from insects.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "Loss of habitat has badly affected insectivorous bats in Madagascar.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "Ricardo Rocha has carried out studies of bats in different parts of the world.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Habitat modification has resulted in indigenous bats in Madagascar becoming useful to farmers.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "The Malagasy mouse-eared bat is more common than other indigenous bat species in Madagascar.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "Bats may feed on paddy swarming caterpillars and grass webworms.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "DNA analysis of bat 7 ________", "blank": True}, "correctAnswer": "droppings"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "ate pests of rice, 8 ________, sugarcane, nuts and fruit", "blank": True}, "correctAnswer": "coffee"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "prevent the spread of disease by eating 9 ________ and blackflies", "blank": True}, "correctAnswer": "mosquitoes"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "they provide food rich in 10 ________", "blank": True}, "correctAnswer": "protein"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "the buildings where they roost become 11 ________", "blank": True}, "correctAnswer": "unclean"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "they play an important role in local 12 ________", "blank": True}, "correctAnswer": "culture"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "farmers should provide special 13 ________ to support the bat population", "blank": True}, "correctAnswer": "houses"},
    ]

    p2_content = clean_page(read_page(85)) + "\n\n" + clean_page(read_page(86))
    sec_opts_6 = [{"label": c, "text": f"Section {c}"} for c in ["A", "B", "C", "D", "E", "F"]]
    lit_opts = [
        {"label": "A", "text": "Very little research has been done into the link between high literacy rates and improved earnings."},
        {"label": "B", "text": "Literacy rates in Germany between 1600 and 1900 were very good."},
        {"label": "C", "text": "There is strong evidence that high literacy rates in the modern world result in economic growth."},
        {"label": "D", "text": "England is a good example of how high literacy rates helped a country industrialise."},
        {"label": "E", "text": "Economic growth can help to improve literacy rates."}
    ]
    guild_opts = [
        {"label": "A", "text": "They helped young people to learn a skill."},
        {"label": "B", "text": "They were opposed to people moving to an area for work."},
        {"label": "C", "text": "They kept better records than guilds in other parts of the world."},
        {"label": "D", "text": "They opposed practices that threatened their control over a trade."},
        {"label": "E", "text": "They predominantly consisted of wealthy merchants."}
    ]
    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "an explanation of the need for research to focus on individuals with a fairly consistent income", "options": sec_opts_6}, "correctAnswer": "E"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "examples of the sources the database has been compiled from", "options": sec_opts_6}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "an account of one individual’s refusal to obey an order", "options": sec_opts_6}, "correctAnswer": "D"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a reference to a region being particularly suited to research into the link between education and economic growth", "options": sec_opts_6}, "correctAnswer": "F"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "examples of the items included in a list of personal possessions", "options": sec_opts_6}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "as well as those of their 19 ________ , over a 300-year period.", "blank": True}, "correctAnswer": "descendants"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "while they should have been paying attention to a 20 ________ .", "blank": True}, "correctAnswer": "sermon"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "As a punishment, she was later given a 21 ________ .", "blank": True}, "correctAnswer": "fine"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "how the guilds could prevent 22 ________ and stop skilled people from working.", "blank": True}, "correctAnswer": "innovation"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about literacy rates in Section B? (Option 1)", "options": lit_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about literacy rates in Section B? (Option 2)", "options": lit_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make in Section F about guilds in German-speaking Central Europe between 1600 and 1900? (Option 1)", "options": guild_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make in Section F about guilds in German-speaking Central Europe between 1600 and 1900? (Option 2)", "options": guild_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
    ]

    p3_content = clean_page(read_page(89)) + "\n\n" + clean_page(read_page(90))
    para_opts_8 = [{"label": c, "text": f"Paragraph {c}"} for c in ["A", "B", "C", "D", "E", "F", "G", "H"]]
    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "a reference to earlier examples of blindfold chess", "options": para_opts_8}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "an outline of what blindfold chess involves", "options": para_opts_8}, "correctAnswer": "E"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "a claim that Gareyev’s skill is limited to chess", "options": para_opts_8}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "why Gareyev’s skill is of interest to scientists", "options": para_opts_8}, "correctAnswer": "B"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "an outline of Gareyev’s priorities", "options": para_opts_8}, "correctAnswer": "H"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "a reason why the last part of a game may be difficult", "options": para_opts_8}, "correctAnswer": "E"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "In the forthcoming games, all the participants will be blindfolded.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "Gareyev has won competitions in BASE jumping.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "UCLA is the first university to carry out research into blindfold chess players.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Good chess players are likely to be able to play blindfold chess.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The researchers started by testing Gareyev’s 37 ________ ;", "blank": True}, "correctAnswer": "memory"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "for example, he was required to recall a string of 38 ________ in order and also in reverse order.", "blank": True}, "correctAnswer": "numbers"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "scans showed an unusual amount of 39 ________ within the areas of Gareyev’s brain that are concerned with directing attention.", "blank": True}, "correctAnswer": "communication"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "unusual strength in the parts of his brain that deal with 40 ________ input.", "blank": True}, "correctAnswer": "visual"},
    ]

    reading_test = {
        "title": "Test 42.C17.04 - Reading",
        "slug": "test-42-reading",
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
