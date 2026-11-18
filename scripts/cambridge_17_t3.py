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

def get_test_41():
    # ==================== LISTENING ====================
    s1_content = clean_page(read_page(53))
    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Recommends surfing for 1 ________ holidays in the summer", "blank": True}, "correctAnswer": "family"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Need to be quite 2 ________", "blank": True}, "correctAnswer": "fit"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Lahinch has some good quality 3 ________ and surf schools", "blank": True}, "correctAnswer": "hotels"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Good surf school at 4 ________ beach", "blank": True}, "correctAnswer": "Carrowniskey"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Surf camp lasts for one 5 ________", "blank": True}, "correctAnswer": "week"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Can also explore the local 6 ________ by kayak", "blank": True}, "correctAnswer": "bay"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Best month to go: 7 ________", "blank": True}, "correctAnswer": "September"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Average temperature in summer: approx. 8 ________ degrees", "blank": True}, "correctAnswer": "19", "acceptableAnswers": ["19", "nineteen"]},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Wetsuit and surfboard: 9 ________ euros per day", "blank": True}, "correctAnswer": "30", "acceptableAnswers": ["30", "thirty"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Also advisable to hire 10 ________ for warmth", "blank": True}, "correctAnswer": "boots"},
    ]

    s2_content = clean_page(read_page(54)) + "\n\n" + clean_page(read_page(55))
    s2_facts_opts = [
        {"label": "A", "text": "It started recently."},
        {"label": "B", "text": "More children attend after school than before school."},
        {"label": "C", "text": "An average of 50 children attend in the mornings."},
        {"label": "D", "text": "A child cannot attend both the before and after school sessions."},
        {"label": "E", "text": "The maximum number of children who can attend is 70."}
    ]
    s2_activities_opts = [
        {"label": "A", "text": "has limited availability"},
        {"label": "B", "text": "is no longer available"},
        {"label": "C", "text": "is for over 8s only"},
        {"label": "D", "text": "requires help from parents"},
        {"label": "E", "text": "involves an additional fee"},
        {"label": "F", "text": "is a new activity"},
        {"label": "G", "text": "was requested by children"}
    ]
    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO facts are given about the school’s extended hours childcare service? (Option 1)", "options": s2_facts_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO facts are given about the school’s extended hours childcare service? (Option 2)", "options": s2_facts_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "How much does childcare cost for a complete afternoon session per child?", "options": [{"label": "A", "text": "£3.50"}, {"label": "B", "text": "£5.70"}, {"label": "C", "text": "£7.20"}]}, "correctAnswer": "C"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the manager say about food?", "options": [{"label": "A", "text": "Children with allergies should bring their own food."}, {"label": "B", "text": "Children may bring healthy snacks with them."}, {"label": "C", "text": "Children are given a proper meal at 5 p.m."}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is different about arrangements in the school holidays?", "options": [{"label": "A", "text": "Children from other schools can attend."}, {"label": "B", "text": "Older children can attend."}, {"label": "C", "text": "A greater number of children can attend."}]}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Spanish", "options": s2_activities_opts}, "correctAnswer": "E"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Music", "options": s2_activities_opts}, "correctAnswer": "D"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Painting", "options": s2_activities_opts}, "correctAnswer": "G"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Yoga", "options": s2_activities_opts}, "correctAnswer": "F"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Cooking", "options": s2_activities_opts}, "correctAnswer": "C"},
    ]

    s3_content = clean_page(read_page(56)) + "\n\n" + clean_page(read_page(57))
    skills_aspects_opts = [
        {"label": "A", "text": "being flexible"},
        {"label": "B", "text": "focusing on details"},
        {"label": "C", "text": "having a smart appearance"},
        {"label": "D", "text": "hiding your emotions"},
        {"label": "E", "text": "relying on experts"},
        {"label": "F", "text": "trusting your own views"},
        {"label": "G", "text": "doing one thing at a time"},
        {"label": "H", "text": "thinking of the future"}
    ]
    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Holly has chosen the Orion Stadium placement because", "options": [{"label": "A", "text": "it involves children."}, {"label": "B", "text": "it is outdoors."}, {"label": "C", "text": "it sounds like fun."}]}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which aspect of safety does Dr Green emphasise most?", "options": [{"label": "A", "text": "ensuring children stay in the stadium"}, {"label": "B", "text": "checking the equipment children will use"}, {"label": "C", "text": "removing obstacles in changing rooms"}]}, "correctAnswer": "A"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Dr Green say about the spectators?", "options": [{"label": "A", "text": "They can be hard to manage."}, {"label": "B", "text": "They make useful volunteers."}, {"label": "C", "text": "They shouldn’t take photographs."}]}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "What has affected the schedule in the past?", "options": [{"label": "A", "text": "bad weather"}, {"label": "B", "text": "an injury"}, {"label": "C", "text": "extra time"}]}, "correctAnswer": "B"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Communication", "options": skills_aspects_opts}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Organisation", "options": skills_aspects_opts}, "correctAnswer": "A"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Time management", "options": skills_aspects_opts}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Creativity", "options": skills_aspects_opts}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Leadership", "options": skills_aspects_opts}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Networking", "options": skills_aspects_opts}, "correctAnswer": "H"},
    ]

    s4_content = clean_page(read_page(58))
    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "It was believed that birds hibernated underwater or buried themselves in 31 ________ .", "blank": True}, "correctAnswer": "mud"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "In autumn he observed that redstarts experience the loss of 32 ________ and thought they then turned into robins.", "blank": True}, "correctAnswer": "feathers"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Aristotle’s assumptions were logical because the two species of birds had a similar 33 ________ .", "blank": True}, "correctAnswer": "shape"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Charles Morton popularised the idea that birds fly to the 34 ________ in winter.", "blank": True}, "correctAnswer": "moon"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "In 1822, a stork was killed in Germany which had an African spear in its 35 ________ .", "blank": True}, "correctAnswer": "neck"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "previously there had been no 36 ________ that storks migrate to Africa", "blank": True}, "correctAnswer": "evidence"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Little was known about the 37 ________ and journeys of migrating birds until the practice of ringing was established.", "blank": True}, "correctAnswer": "destinations"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "were considered incapable of travelling across huge 38 ________ .", "blank": True}, "correctAnswer": "oceans"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Ringing depended on what is called the 39 ‘________’ of dead birds.", "blank": True}, "correctAnswer": "recovery"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "In 1931, the first 40 ________ to show the migration of European birds was printed.", "blank": True}, "correctAnswer": "atlas"},
    ]

    listening_test = {
        "title": "Test 41.C17.03 - Listening",
        "slug": "test-41-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "examType": "ACADEMIC",
        "audioUrl": "/uploads/audio/test-41-section-1.mp3",
        "sourceFolder": "Cambridge IELTS 17 PDF.pdf",
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "parts": [
            {"order": 0, "title": "Part 1", "content": s1_content, "audioUrl": "/uploads/audio/test-41-section-1.mp3", "questions": s1_questions},
            {"order": 1, "title": "Part 2", "content": s2_content, "audioUrl": "/uploads/audio/test-41-section-2.mp3", "questions": s2_questions},
            {"order": 2, "title": "Part 3", "content": s3_content, "audioUrl": "/uploads/audio/test-41-section-3.mp3", "questions": s3_questions},
            {"order": 3, "title": "Part 4", "content": s4_content, "audioUrl": "/uploads/audio/test-41-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = clean_page(read_page(59)) + "\n\n" + clean_page(read_page(60))
    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "ate an entirely 1 ________ diet", "blank": True}, "correctAnswer": "carnivorous"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "probably depended mainly on 2 ________ when hunting", "blank": True}, "correctAnswer": "scent"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "young spent first months of life inside its mother’s 3 ________", "blank": True}, "correctAnswer": "pouch"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "last evidence in mainland Australia is a 3,100-year-old 4 ________", "blank": True}, "correctAnswer": "fossil"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "reduction in 5 ________ and available sources of food were partly responsible for decline in Tasmania", "blank": True}, "correctAnswer": "habitat"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "Significant numbers of thylacines were killed by humans from the 1830s onwards.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "Several thylacines were born in zoos during the late 1800s.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "John Gould’s prediction about the thylacine surprised some biologists.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "In the early 1900s, many scientists became worried about the possible extinction of the thylacine.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "T. T. Flynn’s proposal to rehome captive thylacines on an island proved to be impractical.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "There were still reasonable numbers of thylacines in existence when a piece of legislation protecting the species during their breeding season was passed.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "From 1930 to 1936, the only known living thylacines were all in captivity.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Attempts to find living thylacines are now rarely made.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_content = clean_page(read_page(63)) + "\n\n" + clean_page(read_page(64))
    sec_opts_8 = [{"label": c, "text": f"Section {c}"} for c in ["A", "B", "C", "D", "E", "F", "G", "H"]]
    rspo_opts = [
        {"label": "A", "text": "Its membership has grown steadily over the course of the last decade."},
        {"label": "B", "text": "It demands that certified producers be open and honest about their practices."},
        {"label": "C", "text": "It took several years to establish its set of criteria for sustainable palm oil certification."},
        {"label": "D", "text": "Its regulations regarding sustainability are stricter than those governing other industries."},
        {"label": "E", "text": "It was formed at the request of environmentalists concerned about the loss of virgin forests."}
    ]
    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "examples of a range of potential environmental advantages of oil palm tree cultivation", "options": sec_opts_8}, "correctAnswer": "F"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "description of an organisation which controls the environmental impact of palm oil production", "options": sec_opts_8}, "correctAnswer": "G"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "examples of the widespread global use of palm oil", "options": sec_opts_8}, "correctAnswer": "A"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "reference to a particular species which could benefit the ecosystem of oil palm plantations", "options": sec_opts_8}, "correctAnswer": "H"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "figures illustrating the rapid expansion of the palm oil industry", "options": sec_opts_8}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "an economic justification for not opposing the palm oil industry", "options": sec_opts_8}, "correctAnswer": "E"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "examples of creatures badly affected by the establishment of oil palm plantations", "options": sec_opts_8}, "correctAnswer": "C"},
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO statements are made about the Roundtable on Sustainable Palm Oil (RSPO)? (Option 1)", "options": rspo_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO statements are made about the Roundtable on Sustainable Palm Oil (RSPO)? (Option 2)", "options": rspo_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 23, "order": 22, "type": "GAP_FILL", "content": {"stem": "One advantage of palm oil for manufacturers is that it stays 23 ________ even when not refrigerated.", "blank": True}, "correctAnswer": "solid"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "The 24 ________ is the best known of the animals suffering habitat loss as a result of the spread of oil palm plantations.", "blank": True}, "correctAnswer": "orangutan", "acceptableAnswers": ["orangutan", "orang-utan", "Sumatran orangutan", "Sumatran orang-utan"]},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "As one of its criteria for the certification of sustainable palm oil, the RSPO insists that growers check 25 ________ on a routine basis.", "blank": True}, "correctAnswer": "carbon stocks"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "Ellwood and his researchers are looking into whether the bird’s nest fern could restore 26 ________ in areas where oil palm trees are grown.", "blank": True}, "correctAnswer": "biodiversity"},
    ]

    p3_content = clean_page(read_page(67)) + "\n\n" + clean_page(read_page(68))
    ynng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    bedrock_opts = [
        {"label": "A", "text": "development plans"},
        {"label": "B", "text": "deep excavations"},
        {"label": "C", "text": "great distance"},
        {"label": "D", "text": "excessive expense"},
        {"label": "E", "text": "impossible tasks"},
        {"label": "F", "text": "associated risks"},
        {"label": "G", "text": "water level"},
        {"label": "H", "text": "specific areas"},
        {"label": "I", "text": "total expenditure"},
        {"label": "J", "text": "construction guidelines"}
    ]
    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does Shester make about Barr’s book in the first paragraph?", "options": [{"label": "A", "text": "It gives a highly original explanation for urban development."}, {"label": "B", "text": "Elements of Barr’s research papers are incorporated throughout the book."}, {"label": "C", "text": "Other books that are available on the subject have taken a different approach."}, {"label": "D", "text": "It covers a range of factors that affected the development of New York."}]}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does Shester respond to the information in the book about tenements?", "options": [{"label": "A", "text": "She describes the reasons for Barr’s interest."}, {"label": "B", "text": "She indicates a potential problem with Barr’s analysis."}, {"label": "C", "text": "She compares Barr’s conclusion with that of other writers."}, {"label": "D", "text": "She provides details about the sources Barr used for his research."}]}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Shester say about chapter six of the book?", "options": [{"label": "A", "text": "It contains conflicting data."}, {"label": "B", "text": "It focuses too much on possible trends."}, {"label": "C", "text": "It is too specialised for most readers."}, {"label": "D", "text": "It draws on research that is out of date."}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Shester suggest about the chapters focusing on the 1920s building boom?", "options": [{"label": "A", "text": "The information should have been organised differently."}, {"label": "B", "text": "More facts are needed about the way construction was financed."}, {"label": "C", "text": "The explanation that is given for the building boom is unlikely."}, {"label": "D", "text": "Some parts will have limited appeal to certain people."}]}, "correctAnswer": "D"},
        {"number": 31, "order": 30, "type": "MULTIPLE_CHOICE", "content": {"stem": "What impresses Shester the most about the chapter on land values?", "options": [{"label": "A", "text": "the broad time period that is covered"}, {"label": "B", "text": "the interesting questions that Barr asks"}, {"label": "C", "text": "the nature of the research into the topic"}, {"label": "D", "text": "the recommendations Barr makes for the future"}]}, "correctAnswer": "C"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "The description in the first chapter of how New York probably looked from the air in the early 1600s lacks interest.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "Chapters two and three prepare the reader well for material yet to come.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "The biggest problem for many nineteenth-century New York immigrant neighbourhoods was a lack of amenities.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "In the nineteenth century, New York’s immigrant neighbourhoods tended to concentrate around the harbour.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "skyscrapers are absent from 36 ________", "options": bedrock_opts}, "correctAnswer": "H"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "this cannot be regarded as 37 ________", "options": bedrock_opts}, "correctAnswer": "D"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "especially when compared to 38 ________ .", "options": bedrock_opts}, "correctAnswer": "I"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "He describes not only how 39 ________ are made possible by the use of caissons,", "options": bedrock_opts}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "but he also discusses their 40 ________ .", "options": bedrock_opts}, "correctAnswer": "F"},
    ]

    reading_test = {
        "title": "Test 41.C17.03 - Reading",
        "slug": "test-41-reading",
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
