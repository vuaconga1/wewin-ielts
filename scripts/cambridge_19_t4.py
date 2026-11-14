# Test 22: Cambridge 19 Test 4 (Test 22.C19.04)
import json
import os

def get_test_22():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t3_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part3_Trang_055-077_Test3.txt")
    t4_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part4_Trang_078-098_Test4.txt")
    with open(t3_txt_path, encoding="utf-8") as f:
        t3_txt = f.read()
    with open(t4_txt_path, encoding="utf-8") as f:
        t4_txt = f.read()

    # ==================== LISTENING ====================
    s1_content = """Questions 1–6
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

First day at work
• Name of supervisor: 1 ...............
• Where to leave coat and bag: use 2 ............... in staffroom
• See Tiffany in HR:
  — to give 3 ............... number
  — to collect 4 ...............
• Location of HR office: on 5 ............... floor
• Supervisor's mobile number: 6 ...............

Questions 7–10
Complete the table below.
Write ONE WORD ONLY for each answer.

Responsibilities
| Section | Task 1 | Task 2 | Notes |
| --- | --- | --- | --- |
| Bakery section | Check sell-by dates | Change price labels | Use 7 ............... labels |
| Sushi takeaway counter | Re-stock with 8 ............... boxes if needed | Wipe preparation area and clean the sink | Do not clean any knives |
| Meat and fish counters | Clean the serving area, including the weighing scales | Collect 9 ............... for the fish from the cold-room | Must wear special 10 ............... |"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Name of supervisor: ________", "blank": True}, "correctAnswer": "Kaeden"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Where to leave coat and bag: use ________ in staffroom", "blank": True}, "correctAnswer": "lockers", "acceptableAnswers": ["locker", "lockers", "locker(s)"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "to give ________ number", "blank": True}, "correctAnswer": "passport"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "to collect ________", "blank": True}, "correctAnswer": "uniform"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Location of HR office: on ________ floor", "blank": True}, "correctAnswer": "third", "acceptableAnswers": ["third", "3rd"]},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Supervisor's mobile number: ________", "blank": True}, "correctAnswer": "0412 665 903", "acceptableAnswers": ["0412 665 903", "0412665903"]},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Use ________ labels", "blank": True}, "correctAnswer": "yellow"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Re-stock with ________ boxes if needed", "blank": True}, "correctAnswer": "plastic"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Collect ________ for the fish from the cold-room", "blank": True}, "correctAnswer": "ice"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Must wear special ________", "blank": True}, "correctAnswer": "gloves"},
    ]

    s2_content = """Questions 11 and 12
Choose TWO letters, A–E.
Which TWO problems with some training programmes for new runners does Liz mention?
A There is a risk of serious injury.
B They are unsuitable for certain age groups.
C They are unsuitable for people with health issues.
D It is difficult to stay motivated.
E There is a lack of individual support.

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO tips does Liz recommend for new runners?
A doing two runs a week
B running in the evening
C going on runs with a friend
D listening to music during runs
E running very slowly

Questions 15–18
What reason prevented each of the following members of the Compton Park Runners Club from joining until recently?
Write the correct letter, A, B, or C next to Questions 15–18.

Reasons
A a lack of confidence
B a dislike of running
C a lack of time

Club members
15 Ceri
16 James
17 Leo
18 Mark

Questions 19 and 20
Choose the correct letter, A, B or C.

19 What does Liz say about running her first marathon?
A It had always been her ambition.
B Her husband persuaded her to do it.
C She nearly gave up before the end.

20 Liz says new runners should sign up for a race
A every six months.
B within a few weeks of taking up running.
C after completing several practice runs."""

    q11_12_opts = [
        {"label": "A", "text": "There is a risk of serious injury."},
        {"label": "B", "text": "They are unsuitable for certain age groups."},
        {"label": "C", "text": "They are unsuitable for people with health issues."},
        {"label": "D", "text": "It is difficult to stay motivated."},
        {"label": "E", "text": "There is a lack of individual support."},
    ]
    q13_14_opts = [
        {"label": "A", "text": "doing two runs a week"},
        {"label": "B", "text": "running in the evening"},
        {"label": "C", "text": "going on runs with a friend"},
        {"label": "D", "text": "listening to music during runs"},
        {"label": "E", "text": "running very slowly"},
    ]
    runner_reasons = [
        {"label": "A", "text": "a lack of confidence"},
        {"label": "B", "text": "a dislike of running"},
        {"label": "C", "text": "a lack of time"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO problems with some training programmes for new runners does Liz mention?", "options": q11_12_opts, "selectCount": 2, "covers": [11, 12]}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 11}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO tips does Liz recommend for new runners?", "options": q13_14_opts, "selectCount": 2, "covers": [13, 14]}, "correctAnswer": "A", "acceptableAnswers": ["A", "D"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 13}, "correctAnswer": "D", "acceptableAnswers": ["A", "D"]},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Ceri", "options": runner_reasons}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "James", "options": runner_reasons}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Leo", "options": runner_reasons}, "correctAnswer": "C"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Mark", "options": runner_reasons}, "correctAnswer": "A"},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Liz say about running her first marathon?", "options": [{"label": "A", "text": "It had always been her ambition."}, {"label": "B", "text": "Her husband persuaded her to do it."}, {"label": "C", "text": "She nearly gave up before the end."}]}, "correctAnswer": "C"},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Liz says new runners should sign up for a race", "options": [{"label": "A", "text": "every six months."}, {"label": "B", "text": "within a few weeks of taking up running."}, {"label": "C", "text": "after completing several practice runs."}]}, "correctAnswer": "B"},
    ]

    s3_content = """Questions 21–25
Choose the correct letter, A, B or C.

21 Kieran thinks the packing advice given by Jane's grandfather is
A common sense.
B hard to follow.
C over-protective.

22 How does Jane feel about the books her grandfather has given her?
A They are not worth keeping.
B They should go to a collector.
C They have sentimental value for her.

23 Jane and Kieran agree that hardback books should be
A put out on display.
B given as gifts to visitors.
C more attractively designed.

24 While talking about taking a book from a shelf, Jane
A describes the mistakes other people make doing it.
B reflects on a significant childhood experience.
C explains why some books are easier to remove than others.

25 What do Jane and Kieran suggest about new books?
A Their parents liked buying them as presents.
B They would like to buy more of them.
C Not everyone can afford them.

Questions 26–30
Where does Jane's grandfather keep each of the following types of books in his shop?
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 26–30.

Location of books
A near the entrance
B in the attic
C at the back of the shop
D on a high shelf
E near the stairs
F in a specially designed space
G within the café

Types of books
26 rare books
27 children's books
28 unwanted books
29 requested books
30 coursebooks"""

    book_locations = [
        {"label": "A", "text": "near the entrance"},
        {"label": "B", "text": "in the attic"},
        {"label": "C", "text": "at the back of the shop"},
        {"label": "D", "text": "on a high shelf"},
        {"label": "E", "text": "near the stairs"},
        {"label": "F", "text": "in a specially designed space"},
        {"label": "G", "text": "within the café"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Kieran thinks the packing advice given by Jane's grandfather is", "options": [{"label": "A", "text": "common sense."}, {"label": "B", "text": "hard to follow."}, {"label": "C", "text": "over-protective."}]}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does Jane feel about the books her grandfather has given her?", "options": [{"label": "A", "text": "They are not worth keeping."}, {"label": "B", "text": "They should go to a collector."}, {"label": "C", "text": "They have sentimental value for her."}]}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Jane and Kieran agree that hardback books should be", "options": [{"label": "A", "text": "put out on display."}, {"label": "B", "text": "given as gifts to visitors."}, {"label": "C", "text": "more attractively designed."}]}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "While talking about taking a book from a shelf, Jane", "options": [{"label": "A", "text": "describes the mistakes other people make doing it."}, {"label": "B", "text": "reflects on a significant childhood experience."}, {"label": "C", "text": "explains why some books are easier to remove than others."}]}, "correctAnswer": "B"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "What do Jane and Kieran suggest about new books?", "options": [{"label": "A", "text": "Their parents liked buying them as presents."}, {"label": "B", "text": "They would like to buy more of them."}, {"label": "C", "text": "Not everyone can afford them."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "rare books", "options": book_locations}, "correctAnswer": "D"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "children's books", "options": book_locations}, "correctAnswer": "F"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "unwanted books", "options": book_locations}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "requested books", "options": book_locations}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "coursebooks", "options": book_locations}, "correctAnswer": "G"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Tree planting

Reforestation projects should:
• include a range of tree species
• not include invasive species because of possible 31 ............... with native species
• aim to capture carbon, protect the environment and provide sustainable sources of 32 ............... for local people
• use tree seeds with a high genetic diversity to increase resistance to 33 ............... and climate change
• plant trees on previously forested land which is in a bad condition, not select land which is being used for 34 ...............

Large-scale reforestation projects
• Base planning decisions on information from accurate 35 ...............
• Drones are useful for identifying areas in Brazil which are endangered by keeping 36 ............... and illegal logging.

Lampang Province, Northern Thailand
• A forest was restored in an area damaged by mining.
• A variety of native fig trees were planted, which are important for supporting many wildlife species
• Fig trees speed up the process of recovery by attracting animals and birds, increasing the 37 ............... of recovery.
• For example, 38 ............... were soon attracted to the area.

Involving local communities
• Destruction of mangrove forests in Madagascar made it difficult for people to make a living from 39 ...............
• The mangrove reforestation project:
  — provided employment for local people
  — restored a healthy ecosystem
  — protects against the higher risk of 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "not include invasive species because of possible ________ with native species", "blank": True}, "correctAnswer": "competition"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "provide sustainable sources of ________ for local people", "blank": True}, "correctAnswer": "food"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "increase resistance to ________ and climate change", "blank": True}, "correctAnswer": "disease"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "not select land which is being used for ________", "blank": True}, "correctAnswer": "agriculture"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Base planning decisions on information from accurate ________", "blank": True}, "correctAnswer": "maps"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "identifying areas in Brazil which are endangered by keeping ________ and illegal logging.", "blank": True}, "correctAnswer": "cattle"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "increasing the ________ of recovery by attracting animals and birds", "blank": True}, "correctAnswer": "speed"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "e.g., ________ were soon attracted to the area.", "blank": True}, "correctAnswer": "monkeys"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "made it difficult for people to make a living from ________", "blank": True}, "correctAnswer": "fishing"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "protects against the higher risk of ________", "blank": True}, "correctAnswer": "flooding"},
    ]

    listening_draft = {
        "title": "Test 22.C19.04 - Listening",
        "slug": "test-22-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-22-section-1.mp3",
            "/uploads/audio/test-22-section-2.mp3",
            "/uploads/audio/test-22-section-3.mp3",
            "/uploads/audio/test-22-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-22-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-22-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-22-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-22-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    # Passage 1: The impact of climate change on butterflies in Britain
    p1_body = t4_txt[t4_txt.find("The impact of climate change on butterflies in Britain"):t4_txt.find("Questions 1—6")].strip()
    p1_content = f"""You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

{p1_body}

Questions 1–6
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–6 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 Forty years ago, there were fewer butterflies in Britain than at present.
2 Caterpillars are eaten by a number of different predators.
3 'Phenology' is a term used to describe a creature's ability to alter the location of a lifecycle event.
4 Some species of butterfly have a reduced lifespan due to spring temperature increases.
5 There is a clear reason for the adaptations that butterflies are making to climate change.
6 The data used in the study was taken from the work of amateur butterfly watchers.

Questions 7–13
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 7–13 on your answer sheet.

Butterflies in the UK

The Small Blue
• lives in large 7 ...............
• first appears at the start of 8 ...............
• is considered to be more 9 ............... than other species
• completes more than one reproductive cycle per year

The High Brown Fritillary
• has one reproductive cycle
• its caterpillars occupy a limited range of 10 ...............

The Silver-studded Blue
• is already able to reproduce twice a year in warm areas of 11 ...............

The White Admiral
• is found in 12 ............... areas of England
• both climate change and the 13 ............... of the caterpillar are possible reasons for decline"""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "Forty years ago, there were fewer butterflies in Britain than at present.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "Caterpillars are eaten by a number of different predators.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "'Phenology' is a term used to describe a creature's ability to alter the location of a lifecycle event.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Some species of butterfly have a reduced lifespan due to spring temperature increases.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "There is a clear reason for the adaptations that butterflies are making to climate change.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "The data used in the study was taken from the work of amateur butterfly watchers.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "lives in large ________", "blank": True}, "correctAnswer": "colonies"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "first appears at the start of ________", "blank": True}, "correctAnswer": "spring"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "is considered to be more ________ than other species", "blank": True}, "correctAnswer": "endangered"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "its caterpillars occupy a limited range of ________", "blank": True}, "correctAnswer": "habitats", "acceptableAnswers": ["habitat", "habitats", "habitat(s)"]},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "is already able to reproduce twice a year in warm areas of ________", "blank": True}, "correctAnswer": "Europe"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "is found in ________ areas of England", "blank": True}, "correctAnswer": "southern"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "both climate change and the ________ of the caterpillar are possible reasons for decline", "blank": True}, "correctAnswer": "diet"},
    ]

    # Passage 2: Deep-sea mining
    p2_body = t4_txt[t4_txt.find("Deep-sea mining"):t4_txt.find("Questions 14—17")].strip()
    p2_content = f"""You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

{p2_body}

Questions 14–17
Reading Passage 2 has six paragraphs, A–F.
Which paragraph contains the following information?
Write the correct letter, A–F, in boxes 14–17 on your answer sheet.

14 reference to the rapidly increasing need for one raw material in the transport industry
15 a rough estimate of the area of the Earth covered by the oceans
16 how a particular underwater habitat, where minerals and organisms co-exist, is formed
17 reference to the fact that the countries of the world have yet to agree on rules for the exploration of the seabed

Questions 18–23
Look at the following statements (Questions 18–23) and the list of people below.
Match each statement with the correct person or people, A–E.
Write the correct letter, A–E, in boxes 18–23 on your answer sheet.
NB You may use any letter more than once.

List of People
A Professor Mat Upton
B Julie Hunter, Julian Aguon and Pradeep Singh
C Dr Jon Copley
D Mike Johnston
E Verena Tunnicliffe

18 A move away from the exploration of heavily mined reserves on land is a good idea.
19 The negative effects of undersea exploration on local areas and their inhabitants are being ignored.
20 There are more worthwhile things to extract from the sea than minerals.
21 No other form of human exploration will have such a destructive impact on marine life as deep-sea mining.
22 More is known about outer space than about what lies beneath the oceans.
23 There is one marine life habitat where experts agree mining should not take place.

Questions 24–26
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 24–26 on your answer sheet.

Mining the sea floor
Mining corporations believe that the mineral resources lying under the sea may be superior to those found in the earth. They also say that these can be removed without producing much 24 ...............
The extraction is often done by adapting the 25 ............... that has already been used to work on land. The method of excavation involves removing the seawater from the slurry that is brought up to ships and returning it to the seabed. However, concerned groups strongly believe that 26 ............... is necessary due to the possible number of unidentified consequences."""

    para_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEF"]
    people_opts = [
        {"label": "A", "text": "Professor Mat Upton"},
        {"label": "B", "text": "Julie Hunter, Julian Aguon and Pradeep Singh"},
        {"label": "C", "text": "Dr Jon Copley"},
        {"label": "D", "text": "Mike Johnston"},
        {"label": "E", "text": "Verena Tunnicliffe"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "reference to the rapidly increasing need for one raw material in the transport industry", "options": para_opts}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "a rough estimate of the area of the Earth covered by the oceans", "options": para_opts}, "correctAnswer": "F"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "how a particular underwater habitat, where minerals and organisms co-exist, is formed", "options": para_opts}, "correctAnswer": "E"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "reference to the fact that the countries of the world have yet to agree on rules for the exploration of the seabed", "options": para_opts}, "correctAnswer": "D"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "A move away from the exploration of heavily mined reserves on land is a good idea.", "options": people_opts}, "correctAnswer": "D"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "The negative effects of undersea exploration on local areas and their inhabitants are being ignored.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "There are more worthwhile things to extract from the sea than minerals.", "options": people_opts}, "correctAnswer": "A"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "No other form of human exploration will have such a destructive impact on marine life as deep-sea mining.", "options": people_opts}, "correctAnswer": "E"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "More is known about outer space than about what lies beneath the oceans.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "There is one marine life habitat where experts agree mining should not take place.", "options": people_opts}, "correctAnswer": "C"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "These can be removed without producing much ________", "blank": True}, "correctAnswer": "waste"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "The extraction is often done by adapting the ________ that has already been used to work on land.", "blank": True}, "correctAnswer": "machinery"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "concerned groups strongly believe that ________ is necessary due to the possible number of unidentified consequences.", "blank": True}, "correctAnswer": "caution"},
    ]

    # Passage 3: The Unselfish Gene
    p3_body = t4_txt[t4_txt.find("The Unselfish Gene"):t4_txt.find("Questions 27—30")].strip()
    p3_content = f"""You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

{p3_body}

Questions 27–30
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–30 on your answer sheet.

27 What is the writer doing in the first paragraph?
A setting out two opposing views about human nature
B justifying his opinion about our tendency to be greedy
C describing a commonly held belief about people's behaviour
D explaining why he thinks that humans act in a selfish manner

28 What point is made about Richard Dawkins' book The Selfish Gene?
A Its appeal lay in the radical nature of its ideas.
B Its success was due to the scientific support it offered.
C It presented a view that was in line with the attitudes of its time.
D It took an innovative approach to the analysis of human psychology.

29 What does the writer suggest about the prehistoric era in the fourth paragraph?
A Societies were more complex than many people believe.
B Supplies of natural resources were probably relatively plentiful.
C Most estimates about population sizes are likely to be inaccurate.
D Humans moved across continents more than was previously thought.

30 The writer refers to Bruce Knauft's work as support for the idea that
A selfishness is a relatively recent development in human societies.
B only people in isolated communities can live in an unselfish manner.
C very few lifestyles have survived unchanged since prehistoric times.
D hunter-gatherer cultures worldwide are declining in number.

Questions 31–35
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 31–35 on your answer sheet.

Contemporary hunter-gatherer societies
Bruce Knauft's research shows that contemporary hunter-gatherer societies tend to exhibit a high level of 31 ............... in all areas of life. In these cultures, distributing resources fairly among all members is a moral obligation. These societies also employ strategies to prevent differences in 32 ............... occurring: for example, the !Kung follow a custom whereby the credit for one person's success at 33 ............... is given to another member of the group. Individuals who behave in a 34 ............... manner are punished by being excluded from the group, and women have a considerable amount of 35 ............... in choices regarding work and marriage.

Questions 36–40
Do the following statements agree with the views of the writer in Reading Passage 3?
In boxes 36–40 on your answer sheet, write
YES if the statement agrees with the views of the writer
NO if the statement contradicts the views of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

36 Some anthropologists are mistaken about the point when the number of societies such as the !Kung began to decline.
37 Humans who developed warlike traits in prehistory would have had an advantage over those who did not.
38 Being peaceful and cooperative is a natural way for people to behave.
39 Negative traits are more apparent in some modern cultures than in others.
40 Animal research has failed to reveal a link between changes in the environment and the emergence of aggressive tendencies."""

    y_n_ng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer doing in the first paragraph?", "options": [{"label": "A", "text": "setting out two opposing views about human nature"}, {"label": "B", "text": "justifying his opinion about our tendency to be greedy"}, {"label": "C", "text": "describing a commonly held belief about people's behaviour"}, {"label": "D", "text": "explaining why he thinks that humans act in a selfish manner"}]}, "correctAnswer": "C"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point is made about Richard Dawkins' book The Selfish Gene?", "options": [{"label": "A", "text": "Its appeal lay in the radical nature of its ideas."}, {"label": "B", "text": "Its success was due to the scientific support it offered."}, {"label": "C", "text": "It presented a view that was in line with the attitudes of its time."}, {"label": "D", "text": "It took an innovative approach to the analysis of human psychology."}]}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer suggest about the prehistoric era in the fourth paragraph?", "options": [{"label": "A", "text": "Societies were more complex than many people believe."}, {"label": "B", "text": "Supplies of natural resources were probably relatively plentiful."}, {"label": "C", "text": "Most estimates about population sizes are likely to be inaccurate."}, {"label": "D", "text": "Humans moved across continents more than was previously thought."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "The writer refers to Bruce Knauft's work as support for the idea that", "options": [{"label": "A", "text": "selfishness is a relatively recent development in human societies."}, {"label": "B", "text": "only people in isolated communities can live in an unselfish manner."}, {"label": "C", "text": "very few lifestyles have survived unchanged since prehistoric times."}, {"label": "D", "text": "hunter-gatherer cultures worldwide are declining in number."}]}, "correctAnswer": "A"},
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "exhibit a high level of ________ in all areas of life.", "blank": True}, "correctAnswer": "egalitarianism"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "prevent differences in ________ occurring", "blank": True}, "correctAnswer": "status"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "the credit for one person's success at ________ is given to another member of the group.", "blank": True}, "correctAnswer": "hunting"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Individuals who behave in a ________ manner are punished by being excluded from the group", "blank": True}, "correctAnswer": "domineering"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "women have a considerable amount of ________ in choices regarding work and marriage.", "blank": True}, "correctAnswer": "autonomy"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Some anthropologists are mistaken about the point when the number of societies such as the !Kung began to decline.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Humans who developed warlike traits in prehistory would have had an advantage over those who did not.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "Being peaceful and cooperative is a natural way for people to behave.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "Negative traits are more apparent in some modern cultures than in others.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "Animal research has failed to reveal a link between changes in the environment and the emergence of aggressive tendencies.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
    ]

    reading_draft = {
        "title": "Test 22.C19.04 - Reading",
        "slug": "test-22-reading",
        "skill": "READING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 60,
        "tags": ["#IELTS Academic", "#Reading"],
        "parts": [
            {"title": "Passage 1", "order": 0, "content": p1_content, "questions": p1_questions},
            {"title": "Passage 2", "order": 1, "content": p2_content, "questions": p2_questions},
            {"title": "Passage 3", "order": 2, "content": p3_content, "questions": p3_questions},
        ]
    }

    return [listening_draft, reading_draft]
