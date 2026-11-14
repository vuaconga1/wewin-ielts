# Test 21: Cambridge 19 Test 3 (Test 21.C19.03)
import json
import os

def get_test_21():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t2_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part2_Trang_033-054_Test2.txt")
    t3_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part3_Trang_055-077_Test3.txt")
    with open(t2_txt_path, encoding="utf-8") as f:
        t2_txt = f.read()
    with open(t3_txt_path, encoding="utf-8") as f:
        t3_txt = f.read()

    # ==================== LISTENING ====================
    s1_content = """Questions 1–6
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Local food shops

Where to go
• Kite Place — near the 1 ...............
• Fish market
  — cross the 2 ............... and turn right
  — best to go before 3 ............... pm, earlier than closing time
• Organic shop called 4 ...............
  — below a restaurant in the large, grey building
  — look for the large 5 ............... outside
• Supermarket
  — take a 6 ............... minibus, number 289

Questions 7–10
Complete the table below.
Write ONE WORD ONLY for each answer.

Shopping
| Shop | To buy | Other ideas |
| --- | --- | --- |
| Fish market | a dozen prawns | a handful of 7 ............... (type of seaweed) |
| Organic shop | beans and a 8 ............... for dessert | spices and 9 ............... |
| Bakery | a brown loaf | a 10 ............... tart |"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Kite Place — near the ________", "blank": True}, "correctAnswer": "harbour", "acceptableAnswers": ["harbour", "harbor"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "cross the ________ and turn right", "blank": True}, "correctAnswer": "bridge"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "best to go before ________ pm, earlier than closing time", "blank": True}, "correctAnswer": "3.30", "acceptableAnswers": ["3.30", "3:30"]},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Organic shop called ________", "blank": True}, "correctAnswer": "Rose", "acceptableAnswers": ["Rose", "rose"]},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "look for the large ________ outside", "blank": True}, "correctAnswer": "sign"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "take a ________ minibus, number 289", "blank": True}, "correctAnswer": "purple"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "a handful of ________ (type of seaweed)", "blank": True}, "correctAnswer": "samphire"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "beans and a ________ for dessert", "blank": True}, "correctAnswer": "melon"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "spices and ________", "blank": True}, "correctAnswer": "coconut"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "a ________ tart", "blank": True}, "correctAnswer": "strawberry"},
    ]

    s2_content = """Questions 11–16
What information is given about each of the following festival workshops?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 11–16.

Information
A involves painting and drawing
B will be led by a prize-winning author
C is aimed at children with a disability
D involves a drama activity
E focuses on new relationships
F is aimed at a specific age group
G explores an unhappy feeling
H raises awareness of a particular culture

Festival workshops
11 Superheroes
12 Just do it
13 Count on me
14 Speak up
15 Jump for joy
16 Sticks and stones

Questions 17 and 18
Choose TWO letters, A–E.
Which TWO reasons does the speaker give for recommending Alive and Kicking?
A It will appeal to both boys and girls.
B The author is well known.
C It has colourful illustrations.
D It is funny.
E It deals with an important topic.

Questions 19 and 20
Choose TWO letters, A–E.
Which TWO pieces of advice does the speaker give to parents about reading?
A Encourage children to write down new vocabulary.
B Allow children to listen to audio books.
C Get recommendations from librarians.
D Give children a choice about what they read.
E Only read aloud to children until they can read independently."""

    workshop_info = [
        {"label": "A", "text": "involves painting and drawing"},
        {"label": "B", "text": "will be led by a prize-winning author"},
        {"label": "C", "text": "is aimed at children with a disability"},
        {"label": "D", "text": "involves a drama activity"},
        {"label": "E", "text": "focuses on new relationships"},
        {"label": "F", "text": "is aimed at a specific age group"},
        {"label": "G", "text": "explores an unhappy feeling"},
        {"label": "H", "text": "raises awareness of a particular culture"},
    ]
    q17_18_opts = [
        {"label": "A", "text": "It will appeal to both boys and girls."},
        {"label": "B", "text": "The author is well known."},
        {"label": "C", "text": "It has colourful illustrations."},
        {"label": "D", "text": "It is funny."},
        {"label": "E", "text": "It deals with an important topic."},
    ]
    q19_20_opts = [
        {"label": "A", "text": "Encourage children to write down new vocabulary."},
        {"label": "B", "text": "Allow children to listen to audio books."},
        {"label": "C", "text": "Get recommendations from librarians."},
        {"label": "D", "text": "Give children a choice about what they read."},
        {"label": "E", "text": "Only read aloud to children until they can read independently."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MATCHING", "content": {"stem": "Superheroes", "options": workshop_info}, "correctAnswer": "C"},
        {"number": 12, "order": 11, "type": "MATCHING", "content": {"stem": "Just do it", "options": workshop_info}, "correctAnswer": "D"},
        {"number": 13, "order": 12, "type": "MATCHING", "content": {"stem": "Count on me", "options": workshop_info}, "correctAnswer": "F"},
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Speak up", "options": workshop_info}, "correctAnswer": "G"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Jump for joy", "options": workshop_info}, "correctAnswer": "B"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Sticks and stones", "options": workshop_info}, "correctAnswer": "H"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO reasons does the speaker give for recommending Alive and Kicking?", "options": q17_18_opts, "selectCount": 2, "covers": [17, 18]}, "correctAnswer": "D", "acceptableAnswers": ["D", "E"]},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 17}, "correctAnswer": "E", "acceptableAnswers": ["D", "E"]},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO pieces of advice does the speaker give to parents about reading?", "options": q19_20_opts, "selectCount": 2, "covers": [19, 20]}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 19}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
    ]

    s3_content = """Questions 21–25
Choose the correct letter, A, B or C.

Science experiment for Year 12 students
21 How does Clare feel about the students in her Year 12 science class?
A worried that they are not making progress
B challenged by their poor behaviour in class
C frustrated at their lack of interest in the subject

22 How does Jake react to Clare's suggestion about an experiment based on children's diet?
A He is concerned that the results might not be meaningful.
B He feels some of the data might be difficult to obtain.
C He suspects that the conclusions might be upsetting.

23 What problem do they agree may be involved in an experiment involving animals?
A Any results may not apply to humans.
B It may be complicated to get permission.
C Students may not be happy about animal experiments.

24 What question do they decide the experiment should address?
A Are mice capable of controlling their food intake?
B Does an increase in sugar lead to health problems?
C How much do supplements of different kinds affect health?

25 Clare might also consider doing another experiment involving
A other types of food supplement.
B different genetic strains of mice.
C varying amounts of exercise.

Questions 26–30
Complete the flowchart below.
Choose FIVE answers from the box and write the correct letter, A–H, next to Questions 26–30.

A size
B escape
C age
D water
E cereal
F calculations
G changes
H colour

Experiment on mice:
Choose mice which are all the same 26 ...............
↓
Divide the mice into two groups, each with a different 27 ...............
Put each group in a separate cage.
↓
Feed group A commercial mouse food.
Feed group B the same, but also sugar contained in 28 ...............
↓
Take measurements using an electronic scale.
Place them in a weighing chamber to prevent 29 ...............
↓
Do all necessary 30 ..............."""

    flowchart_opts = [
        {"label": "A", "text": "size"},
        {"label": "B", "text": "escape"},
        {"label": "C", "text": "age"},
        {"label": "D", "text": "water"},
        {"label": "E", "text": "cereal"},
        {"label": "F", "text": "calculations"},
        {"label": "G", "text": "changes"},
        {"label": "H", "text": "colour"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does Clare feel about the students in her Year 12 science class?", "options": [{"label": "A", "text": "worried that they are not making progress"}, {"label": "B", "text": "challenged by their poor behaviour in class"}, {"label": "C", "text": "frustrated at their lack of interest in the subject"}]}, "correctAnswer": "C"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does Jake react to Clare's suggestion about an experiment based on children's diet?", "options": [{"label": "A", "text": "He is concerned that the results might not be meaningful."}, {"label": "B", "text": "He feels some of the data might be difficult to obtain."}, {"label": "C", "text": "He suspects that the conclusions might be upsetting."}]}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "What problem do they agree may be involved in an experiment involving animals?", "options": [{"label": "A", "text": "Any results may not apply to humans."}, {"label": "B", "text": "It may be complicated to get permission."}, {"label": "C", "text": "Students may not be happy about animal experiments."}]}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "What question do they decide the experiment should address?", "options": [{"label": "A", "text": "Are mice capable of controlling their food intake?"}, {"label": "B", "text": "Does an increase in sugar lead to health problems?"}, {"label": "C", "text": "How much do supplements of different kinds affect health?"}]}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Clare might also consider doing another experiment involving", "options": [{"label": "A", "text": "other types of food supplement."}, {"label": "B", "text": "different genetic strains of mice."}, {"label": "C", "text": "varying amounts of exercise."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Choose mice which are all the same [26]", "options": flowchart_opts}, "correctAnswer": "C"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Divide the mice into two groups, each with a different [27]", "options": flowchart_opts}, "correctAnswer": "H"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Feed group B the same, but also sugar contained in [28]", "options": flowchart_opts}, "correctAnswer": "E"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Place them in a weighing chamber to prevent [29]", "options": flowchart_opts}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Do all necessary [30]", "options": flowchart_opts}, "correctAnswer": "F"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Microplastics

Where microplastics come from
• fibres from some 31 ............... during washing
• the breakdown of large pieces of plastic waste from industry
• the action of vehicle tyres on roads

Effects of microplastics
• They cause injuries to the 32 ............... of wildlife and affect their digestive systems.
• They enter the food chain, e.g., in bottled and tap water, 33 ............... and seafood.
• They may not affect human health, but they are already banned in skin cleaning products and 34 ............... in some countries.
• Microplastics enter the soil through the air, rain and 35 ...............

Microplastics in the soil — a study by Anglia Ruskin University
• Earthworms are important because they add 36 ............... to the soil.
• The study aimed to find whether microplastics in earthworms affect the 37 ............... of plants.
• The study found that microplastics caused:
  — 38 ............... loss in earthworms
  — fewer seeds to germinate
  — a rise in the level of 39 ............... in the soil.
• The study concluded:
  — soil should be seen as an important natural process.
  — changes to soil damage both ecosystems and 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "fibres from some ________ during washing", "blank": True}, "correctAnswer": "clothing"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "They cause injuries to the ________ of wildlife and affect their digestive systems.", "blank": True}, "correctAnswer": "mouths"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "They enter the food chain, e.g., in bottled and tap water, ________ and seafood.", "blank": True}, "correctAnswer": "salt"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "banned in skin cleaning products and ________ in some countries.", "blank": True}, "correctAnswer": "toothpaste"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Microplastics enter the soil through the air, rain and ________", "blank": True}, "correctAnswer": "fertilizers", "acceptableAnswers": ["fertilizers", "fertilisers"]},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Earthworms are important because they add ________ to the soil.", "blank": True}, "correctAnswer": "nutrients"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "find whether microplastics in earthworms affect the ________ of plants.", "blank": True}, "correctAnswer": "growth"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "The study found that microplastics caused: ________ loss in earthworms", "blank": True}, "correctAnswer": "weight"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "a rise in the level of ________ in the soil.", "blank": True}, "correctAnswer": "acid"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "changes to soil damage both ecosystems and ________", "blank": True}, "correctAnswer": "society"},
    ]

    listening_draft = {
        "title": "Test 21.C19.03 - Listening",
        "slug": "test-21-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-21-section-1.mp3",
            "/uploads/audio/test-21-section-2.mp3",
            "/uploads/audio/test-21-section-3.mp3",
            "/uploads/audio/test-21-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-21-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-21-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-21-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-21-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    # Passage 1: Archaeologists discover evidence of prehistoric island settlers
    p1_body = t3_txt[t3_txt.find("Archaeologists discover evidence of prehistoric island settlers"):t3_txt.find("Questions 1—7")].strip()
    p1_content = f"""You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

{p1_body}

Questions 1–7
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–7 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 Archaeological research had taken place on the island of Obi before the arrival of Ceri Shipton and his colleagues.
2 At the Kelo sites, the researchers found the first clam shell axes ever to be discovered in the region.
3 The size of Obi today is less than it was 18,000 years ago.
4 A change in the climate around 11,700 years ago had a greater impact on Obi than on the surrounding islands.
5 The researchers believe there is a connection between warmer, wetter weather and a change in the material used to make axes.
6 Shipton's team were surprised to find evidence of the Obi islanders' hunting practices.
7 It is thought that the Kelo shelters were occupied continuously until about 1,000 years ago.

Questions 8–13
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 8–13 on your answer sheet.

Archaeological findings on Obi
Excavations of rock shelters inside 8 ............... near the village of Kelo revealed:
• axes from around 14,000 years ago, probably used to make canoes
• axes made out of 9 ............... dating from around 11,700 years ago
• 10 ............... of an animal: evidence of what ancient islanders ate
• evidence of travel between islands:
  — obsidian: a material that is not found naturally on Obi
  — 11 ............... which resembled ones found on other islands.

It is thought that from 8,000 years ago, Obi islanders:
• may have switched from hunting to fishing
• had 12 ............... as well as items made out of metal
• probably took part in the production and sale of 13 ..............."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "Archaeological research had taken place on the island of Obi before the arrival of Ceri Shipton and his colleagues.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "At the Kelo sites, the researchers found the first clam shell axes ever to be discovered in the region.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "The size of Obi today is less than it was 18,000 years ago.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "A change in the climate around 11,700 years ago had a greater impact on Obi than on the surrounding islands.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "The researchers believe there is a connection between warmer, wetter weather and a change in the material used to make axes.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "Shipton's team were surprised to find evidence of the Obi islanders' hunting practices.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "It is thought that the Kelo shelters were occupied continuously until about 1,000 years ago.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Excavations of rock shelters inside ________ near the village of Kelo revealed:", "blank": True}, "correctAnswer": "caves"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "axes made out of ________ dating from around 11,700 years ago", "blank": True}, "correctAnswer": "stone"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "________ of an animal: evidence of what ancient islanders ate", "blank": True}, "correctAnswer": "bones"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "________ which resembled ones found on other islands.", "blank": True}, "correctAnswer": "beads"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "had ________ as well as items made out of metal", "blank": True}, "correctAnswer": "pottery"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "probably took part in the production and sale of ________", "blank": True}, "correctAnswer": "spices"},
    ]

    # Passage 2: The global importance of wetlands
    p2_body = t3_txt[t3_txt.find("The global importance of wetlands"):t3_txt.find("Questions 14—17")].strip()
    p2_content = f"""You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

{p2_body}

Questions 14–17
Reading Passage 2 has eight paragraphs, A–H.
Which paragraph contains the following information?
Write the correct letter, A–H, in boxes 14–17 on your answer sheet.

14 reference to the need to ensure that inhabitants of wetland regions continue to benefit from them
15 the proportion of wetlands which have already been lost
16 reference to the idea that people are beginning to appreciate the value of wetlands
17 mention of the cultural significance of wetlands

Questions 18–22
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 18–22 on your answer sheet.

18 Peatlands which have been drained begin to release ............... instead of storing it.
19 Once peatland areas have been cleared, ............... are more likely to occur.
20 Clearing peatland forests to make way for oil palm plantations destroys the ............... of the local environment.
21 Water is drained out of peatlands through the ............... which are created by logging companies.
22 Draining peatlands leads to ..............., a serious problem which can eventually result in coastal flooding and land loss.

Questions 23–26
Look at the following statements (Questions 23–26) and the list of experts below.
Match each statement with the correct expert, A–D.
Write the correct letter, A–D, in boxes 23–26 on your answer sheet.

List of Experts
A Matthew McCartney
B Pieter van Eijk
C Marcel Silvius
D Dave Tickner

23 Communities living in wetland regions must be included in discussions about the future of these areas.
24 Official policies towards wetlands vary from one nation to the next.
25 People cause harm to wetlands without having any intention to do so.
26 Initiatives to reverse environmental damage need not be complex."""

    para_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEFGH"]
    expert_opts = [
        {"label": "A", "text": "Matthew McCartney"},
        {"label": "B", "text": "Pieter van Eijk"},
        {"label": "C", "text": "Marcel Silvius"},
        {"label": "D", "text": "Dave Tickner"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "reference to the need to ensure that inhabitants of wetland regions continue to benefit from them", "options": para_opts}, "correctAnswer": "G"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "the proportion of wetlands which have already been lost", "options": para_opts}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "reference to the idea that people are beginning to appreciate the value of wetlands", "options": para_opts}, "correctAnswer": "H"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "mention of the cultural significance of wetlands", "options": para_opts}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "Peatlands which have been drained begin to release ________ instead of storing it.", "blank": True}, "correctAnswer": "carbon"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "Once peatland areas have been cleared, ________ are more likely to occur.", "blank": True}, "correctAnswer": "fires"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "Clearing peatland forests to make way for oil palm plantations destroys the ________ of the local environment.", "blank": True}, "correctAnswer": "biodiversity"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "Water is drained out of peatlands through the ________ which are created by logging companies.", "blank": True}, "correctAnswer": "ditches"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "Draining peatlands leads to ________, a serious problem which can eventually result in coastal flooding and land loss.", "blank": True}, "correctAnswer": "subsidence"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "Communities living in wetland regions must be included in discussions about the future of these areas.", "options": expert_opts}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "Official policies towards wetlands vary from one nation to the next.", "options": expert_opts}, "correctAnswer": "C"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "People cause harm to wetlands without having any intention to do so.", "options": expert_opts}, "correctAnswer": "D"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Initiatives to reverse environmental damage need not be complex.", "options": expert_opts}, "correctAnswer": "B"},
    ]

    # Passage 3: Is the era of artificial speech translation upon us?
    p3_body = t3_txt[t3_txt.find("Is the era of artificial speech translation upon us?"):t3_txt.find("Questions 27—30")].strip()
    p3_content = f"""You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

{p3_body}

Questions 27–30
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–30 on your answer sheet.

27 What does the reader learn about the conversation in the first paragraph?
A The speakers are communicating in different languages.
B Neither of the speakers is familiar with their environment.
C The topic of the conversation is difficult for both speakers.
D Aspects of the conversation are challenging for both speakers.

28 What assists the electronic translator during lectures at Karlsruhe Institute of Technology?
A the repeated content of lectures
B the students' reading skills
C the languages used
D the lecturers' technical ability

29 When referring to The Hitchhiker's Guide to the Galaxy, the writer suggests that
A the Babel fish was considered undesirable at the time.
B this book was not seriously intending to predict the future.
C artificial speech translation was not a surprising development.
D some speech translation techniques are better than others.

30 What does the writer say about sharing earpieces?
A It is something people will get used to doing.
B The reluctance to do this is understandable.
C The equipment will be unnecessary in the future.
D It is something few people need to worry about.

Questions 31–34
Complete each sentence with the correct ending, A–F, below.
Write the correct letter, A–F, in boxes 31–34 on your answer sheet.

31 Speech translation methods are developing fast in Japan
32 TV interviews that use translation voiceover methods are successful
33 Future translation systems should address people appropriately
34 Users may be able to maintain their local customs

A but there are concerns about this.
B as systems do not need to conform to standard practices.
C but they are far from perfect.
D despite the noise issues.
E because translation is immediate.
F and have an awareness of good manners.

Questions 35–40
Do the following statements agree with the views of the writer in Reading Passage 3?
In boxes 35–40 on your answer sheet, write
YES if the statement agrees with the views of the writer
NO if the statement contradicts the views of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

35 Language translation systems will be seen as very useful throughout the academic and professional worlds.
36 The overall value of automated translation to family life is yet to be shown.
37 Automated translation could make life more difficult for immigrant families.
38 Visual aspects of language translation are being considered by scientists.
39 International scientists have found English easier to translate into other languages than Latin.
40 As far as language is concerned, there is a difference between people's social and practical needs."""

    sentence_endings = [
        {"label": "A", "text": "but there are concerns about this."},
        {"label": "B", "text": "as systems do not need to conform to standard practices."},
        {"label": "C", "text": "but they are far from perfect."},
        {"label": "D", "text": "despite the noise issues."},
        {"label": "E", "text": "because translation is immediate."},
        {"label": "F", "text": "and have an awareness of good manners."},
    ]
    y_n_ng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the reader learn about the conversation in the first paragraph?", "options": [{"label": "A", "text": "The speakers are communicating in different languages."}, {"label": "B", "text": "Neither of the speakers is familiar with their environment."}, {"label": "C", "text": "The topic of the conversation is difficult for both speakers."}, {"label": "D", "text": "Aspects of the conversation are challenging for both speakers."}]}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What assists the electronic translator during lectures at Karlsruhe Institute of Technology?", "options": [{"label": "A", "text": "the repeated content of lectures"}, {"label": "B", "text": "the students' reading skills"}, {"label": "C", "text": "the languages used"}, {"label": "D", "text": "the lecturers' technical ability"}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "When referring to The Hitchhiker's Guide to the Galaxy, the writer suggests that", "options": [{"label": "A", "text": "the Babel fish was considered undesirable at the time."}, {"label": "B", "text": "this book was not seriously intending to predict the future."}, {"label": "C", "text": "artificial speech translation was not a surprising development."}, {"label": "D", "text": "some speech translation techniques are better than others."}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer say about sharing earpieces?", "options": [{"label": "A", "text": "It is something people will get used to doing."}, {"label": "B", "text": "The reluctance to do this is understandable."}, {"label": "C", "text": "The equipment will be unnecessary in the future."}, {"label": "D", "text": "It is something few people need to worry about."}]}, "correctAnswer": "B"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Speech translation methods are developing fast in Japan", "options": sentence_endings}, "correctAnswer": "C"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "TV interviews that use translation voiceover methods are successful", "options": sentence_endings}, "correctAnswer": "E"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "Future translation systems should address people appropriately", "options": sentence_endings}, "correctAnswer": "F"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Users may be able to maintain their local customs", "options": sentence_endings}, "correctAnswer": "B"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "Language translation systems will be seen as very useful throughout the academic and professional worlds.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "The overall value of automated translation to family life is yet to be shown.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Automated translation could make life more difficult for immigrant families.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "Visual aspects of language translation are being considered by scientists.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "International scientists have found English easier to translate into other languages than Latin.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "As far as language is concerned, there is a difference between people's social and practical needs.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
    ]

    reading_draft = {
        "title": "Test 21.C19.03 - Reading",
        "slug": "test-21-reading",
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
