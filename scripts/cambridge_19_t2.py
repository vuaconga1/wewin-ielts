# Test 20: Cambridge 19 Test 2 (Test 20.C19.02)
import json
import os

def get_test_20():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t1_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part1_Trang_001-032_Intro_Test1.txt")
    t2_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part2_Trang_033-054_Test2.txt")
    with open(t1_txt_path, encoding="utf-8") as f:
        t1_txt = f.read()
    with open(t2_txt_path, encoding="utf-8") as f:
        t2_txt = f.read()

    # ==================== LISTENING ====================
    s1_content = """Questions 1–6
Complete the form below.
Write ONE WORD AND/OR A NUMBER for each answer.

Guitar Group
Coordinator: Gary 1 ...............
Level: 2 ...............
Place: the 3 ...............
4 ............... Street
First floor, Room T347
Time: Thursday morning at 5 ...............
Recommended website: 'The perfect 6 ...............'

Questions 7–10
Complete the table below.
Write ONE WORD ONLY for each answer.

A typical 45-minute guitar lesson
| Time | Activity | Notes |
| --- | --- | --- |
| 5 minutes | tuning guitars | using an app or by 7 ............... |
| 10 minutes | strumming chords using our thumbs | keeping time while the teacher is 8 ............... |
| 15 minutes | playing songs | often listening to a 9 ............... of a song |
| 10 minutes | playing single notes and simple tunes | playing together, then playing 10 ............... |
| 5 minutes | noting things to practise at home | |"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Coordinator: Gary ________", "blank": True}, "correctAnswer": "Mathieson"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Level: ________", "blank": True}, "correctAnswer": "beginners"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Place: the ________", "blank": True}, "correctAnswer": "college"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "________ Street", "blank": True}, "correctAnswer": "New"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Time: Thursday morning at ________", "blank": True}, "correctAnswer": "11", "acceptableAnswers": ["11", "eleven", "11 am", "11am", "eleven am", "11 (am)", "eleven (am)"]},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Recommended website: 'The perfect ________'", "blank": True}, "correctAnswer": "instrument"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "tuning guitars: using an app or by ________", "blank": True}, "correctAnswer": "ear"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "strumming chords: keeping time while the teacher is ________", "blank": True}, "correctAnswer": "clapping"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "playing songs: often listening to a ________ of a song", "blank": True}, "correctAnswer": "recording"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "playing single notes and simple tunes: playing together, then playing ________", "blank": True}, "correctAnswer": "alone"},
    ]

    s2_content = """Questions 11–16
Choose the correct letter, A, B or C.

Working as a lifeboat volunteer
11 What made David leave London and move to Northsea?
A He was eager to develop a hobby.
B He wanted to work shorter hours.
C He found his job in website design unsatisfying.

12 The Lifeboat Institution in Northsea was built with money provided by
A a local organisation.
B a local resident.
C the local council.

13 In his health assessment, the doctor was concerned about the fact that David
A might be colour blind.
B was rather short-sighted.
C had undergone eye surgery.

14 After arriving at the lifeboat station, they aim to launch the boat within
A five minutes.
B six to eight minutes.
C eight and a half minutes.

15 As a 'helmsman', David has the responsibility of deciding
A who will be the members of his crew.
B what equipment it will be necessary to take.
C if the lifeboat should be launched.

16 As well as going out on the lifeboat, David
A gives talks on safety at sea.
B helps with fundraising.
C recruits new volunteers.

Questions 17 and 18
Choose TWO letters, A–E.
Which TWO things does David say about the lifeboat volunteer training?
A The residential course developed his leadership skills.
B The training in use of ropes and knots was quite brief.
C The training exercises have built up his mental strength.
D The casualty care activities were particularly challenging for him.
E The wave tank activities provided practice in survival techniques.

Questions 19 and 20
Choose TWO letters, A–E.
Which TWO things does David find most motivating about the work he does?
A working as part of a team
B experiences when working in winter
C being thanked by those he has helped
D the fact that it keeps him fit
E the chance to develop new equipment"""

    q17_18_opts = [
        {"label": "A", "text": "The residential course developed his leadership skills."},
        {"label": "B", "text": "The training in use of ropes and knots was quite brief."},
        {"label": "C", "text": "The training exercises have built up his mental strength."},
        {"label": "D", "text": "The casualty care activities were particularly challenging for him."},
        {"label": "E", "text": "The wave tank activities provided practice in survival techniques."},
    ]
    q19_20_opts = [
        {"label": "A", "text": "working as part of a team"},
        {"label": "B", "text": "experiences when working in winter"},
        {"label": "C", "text": "being thanked by those he has helped"},
        {"label": "D", "text": "the fact that it keeps him fit"},
        {"label": "E", "text": "the chance to develop new equipment"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "What made David leave London and move to Northsea?", "options": [{"label": "A", "text": "He was eager to develop a hobby."}, {"label": "B", "text": "He wanted to work shorter hours."}, {"label": "C", "text": "He found his job in website design unsatisfying."}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "The Lifeboat Institution in Northsea was built with money provided by", "options": [{"label": "A", "text": "a local organisation."}, {"label": "B", "text": "a local resident."}, {"label": "C", "text": "the local council."}]}, "correctAnswer": "B"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "In his health assessment, the doctor was concerned about the fact that David", "options": [{"label": "A", "text": "might be colour blind."}, {"label": "B", "text": "was rather short-sighted."}, {"label": "C", "text": "had undergone eye surgery."}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "After arriving at the lifeboat station, they aim to launch the boat within", "options": [{"label": "A", "text": "five minutes."}, {"label": "B", "text": "six to eight minutes."}, {"label": "C", "text": "eight and a half minutes."}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "As a 'helmsman', David has the responsibility of deciding", "options": [{"label": "A", "text": "who will be the members of his crew."}, {"label": "B", "text": "what equipment it will be necessary to take."}, {"label": "C", "text": "if the lifeboat should be launched."}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "As well as going out on the lifeboat, David", "options": [{"label": "A", "text": "gives talks on safety at sea."}, {"label": "B", "text": "helps with fundraising."}, {"label": "C", "text": "recruits new volunteers."}]}, "correctAnswer": "A"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does David say about the lifeboat volunteer training?", "options": q17_18_opts, "selectCount": 2, "covers": [17, 18]}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 17}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does David find most motivating about the work he does?", "options": q19_20_opts, "selectCount": 2, "covers": [19, 20]}, "correctAnswer": "A", "acceptableAnswers": ["A", "B"]},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 19}, "correctAnswer": "B", "acceptableAnswers": ["A", "B"]},
    ]

    s3_content = """Questions 21–24
Choose the correct letter, A, B or C.

21 At first, Don thought the topic of recycling footwear might be too
A limited in scope.
B hard to research.
C boring for listeners.

22 When discussing trainers, Bella and Don disagree about
A how popular they are among young people.
B how suitable they are for school.
C how quickly they wear out.

23 Bella says that she sometimes recycles shoes because
A they no longer fit.
B she no longer likes them.
C they are no longer in fashion.

24 What did the article say that confused Don?
A Public consumption of footwear has risen.
B Less footwear is recycled now than in the past.
C People dispose of more footwear than they used to.

Questions 25–28
What reasons did the recycling manager give for rejecting footwear, according to the students?
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 25–28.

Reasons
A one shoe was missing
B the colour of one shoe had faded
C one shoe had a hole in it
D the shoes were brand new
E the shoes were too dirty
F the stitching on the shoes was broken

Footwear
25 the high-heeled shoes
26 the ankle boots
27 the baby shoes
28 the trainers

Questions 29 and 30
Choose the correct letter, A, B or C.

29 Why did the project to make 'new' shoes out of old shoes fail?
A People believed the 'new' pairs of shoes were unhygienic.
B There were not enough good parts to use in the old shoes.
C The shoes in the 'new' pairs were not completely alike.

30 Bella and Don agree that they can present their topic
A from a new angle.
B with relevant images.
C in a straightforward way."""

    footwear_reasons = [
        {"label": "A", "text": "one shoe was missing"},
        {"label": "B", "text": "the colour of one shoe had faded"},
        {"label": "C", "text": "one shoe had a hole in it"},
        {"label": "D", "text": "the shoes were brand new"},
        {"label": "E", "text": "the shoes were too dirty"},
        {"label": "F", "text": "the stitching on the shoes was broken"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "At first, Don thought the topic of recycling footwear might be too", "options": [{"label": "A", "text": "limited in scope."}, {"label": "B", "text": "hard to research."}, {"label": "C", "text": "boring for listeners."}]}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "When discussing trainers, Bella and Don disagree about", "options": [{"label": "A", "text": "how popular they are among young people."}, {"label": "B", "text": "how suitable they are for school."}, {"label": "C", "text": "how quickly they wear out."}]}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Bella says that she sometimes recycles shoes because", "options": [{"label": "A", "text": "they no longer fit."}, {"label": "B", "text": "she no longer likes them."}, {"label": "C", "text": "they are no longer in fashion."}]}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "What did the article say that confused Don?", "options": [{"label": "A", "text": "Public consumption of footwear has risen."}, {"label": "B", "text": "Less footwear is recycled now than in the past."}, {"label": "C", "text": "People dispose of more footwear than they used to."}]}, "correctAnswer": "B"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "the high-heeled shoes", "options": footwear_reasons}, "correctAnswer": "E"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "the ankle boots", "options": footwear_reasons}, "correctAnswer": "B"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "the baby shoes", "options": footwear_reasons}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "the trainers", "options": footwear_reasons}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why did the project to make 'new' shoes out of old shoes fail?", "options": [{"label": "A", "text": "People believed the 'new' pairs of shoes were unhygienic."}, {"label": "B", "text": "There were not enough good parts to use in the old shoes."}, {"label": "C", "text": "The shoes in the 'new' pairs were not completely alike."}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "Bella and Don agree that they can present their topic", "options": [{"label": "A", "text": "from a new angle."}, {"label": "B", "text": "with relevant images."}, {"label": "C", "text": "in a straightforward way."}]}, "correctAnswer": "A"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Tardigrades
• more than 1,000 species, 0.05–1.2 millimetres long
• also known as water 'bears' (due to how they 31 ...............) and 'moss piglets'

Physical appearance
• a 32 ............... round body and four pairs of legs
• claws or 33 ............... for gripping
• absence of respiratory organs
• body filled with a liquid that carries both 34 ............... and blood
• mouth shaped like a 35 ............... with teeth called stylets

Habitat
• often found at the bottom of a lake or on plants
• very resilient and can exist in very low or high 36 ...............

Cryptobiosis
• In dry conditions, they roll into a ball called a 'tun'.
• They stay alive with a much lower metabolism than usual.
• A type of 37 ............... ensures their DNA is not damaged.
• Research is underway to find out how many days they can stay alive in 38 ...............

Feeding
• consume liquids, e.g., those found in moss or 39 ...............
• may eat other tardigrades

Conservation status
• They are not considered to be 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "also known as water 'bears' (due to how they ________) and 'moss piglets'", "blank": True}, "correctAnswer": "move"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "a ________ round body and four pairs of legs", "blank": True}, "correctAnswer": "short"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "claws or ________ for gripping", "blank": True}, "correctAnswer": "discs", "acceptableAnswers": ["discs", "disks"]},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "body filled with a liquid that carries both ________ and blood", "blank": True}, "correctAnswer": "oxygen"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "mouth shaped like a ________ with teeth called stylets", "blank": True}, "correctAnswer": "tube"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "very resilient and can exist in very low or high ________", "blank": True}, "correctAnswer": "temperatures"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "A type of ________ ensures their DNA is not damaged.", "blank": True}, "correctAnswer": "protein"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Research is underway to find out how many days they can stay alive in ________", "blank": True}, "correctAnswer": "space"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "consume liquids, e.g., those found in moss or ________", "blank": True}, "correctAnswer": "seaweed"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "They are not considered to be ________", "blank": True}, "correctAnswer": "endangered"},
    ]

    listening_draft = {
        "title": "Test 20.C19.02 - Listening",
        "slug": "test-20-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-20-section-1.mp3",
            "/uploads/audio/test-20-section-2.mp3",
            "/uploads/audio/test-20-section-3.mp3",
            "/uploads/audio/test-20-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-20-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-20-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-20-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-20-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    # Passage 1: The Industrial Revolution in Britain
    p1_body = t2_txt[t2_txt.find("The Industrial Revolution in Britain"):t2_txt.find("Questions 1—7")].strip()
    p1_content = f"""You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

{p1_body}

Questions 1–7
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 1–7 on your answer sheet.

Britain's Industrial Revolution

Steam power
• Newcomen's steam engine was used in mines to remove water.
• In Watt and Boulton's steam engine, the movement of the 1 ............... was linked to a gear system.
• A greater supply of 2 ............... was required to power steam engines.

Textile industry
• Before the Industrial Revolution, spinners and weavers worked at home and in 3 ...............
• Not as much 4 ............... was needed to produce cloth once the spinning jenny and power loom were invented.

Iron industry
• Smelting of iron ore with coke resulted in material that was better 5 ...............
• Demand for iron increased with the growth of the 6 ...............

Communications
• Cooke and Wheatstone patented the first telegraphy system.
• The telegraphy system was used to prevent locomotives colliding.

Urbanisation
• Small towns turned into cities very quickly.
• The new cities were dirty, crowded and lacked sufficient 7 ...............

Questions 8–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 8–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 Britain's canal network grew rapidly so that more goods could be transported around the country.
9 Costs in the iron industry rose when the technique of smelting iron ore with coke was introduced.
10 Samuel Morse's communication system was more reliable than that developed by William Cooke and Charles Wheatstone.
11 The economic benefits of industrialisation were limited to certain sectors of society.
12 Some skilled weavers believed that the introduction of the new textile machines would lead to job losses.
13 There was some sympathy among local people for the Luddites who were arrested near Huddersfield."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "In Watt and Boulton's steam engine, the movement of the ________ was linked to a gear system.", "blank": True}, "correctAnswer": "piston"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "A greater supply of ________ was required to power steam engines.", "blank": True}, "correctAnswer": "coal"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Before the Industrial Revolution, spinners and weavers worked at home and in ________", "blank": True}, "correctAnswer": "workshops"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Not as much ________ was needed to produce cloth once the spinning jenny and power loom were invented.", "blank": True}, "correctAnswer": "labour", "acceptableAnswers": ["labour", "labor"]},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Smelting of iron ore with coke resulted in material that was better ________", "blank": True}, "correctAnswer": "quality"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Demand for iron increased with the growth of the ________", "blank": True}, "correctAnswer": "railway", "acceptableAnswers": ["railways", "railway", "railway(s)"]},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "The new cities were dirty, crowded and lacked sufficient ________", "blank": True}, "correctAnswer": "sanitation"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "Britain's canal network grew rapidly so that more goods could be transported around the country.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "Costs in the iron industry rose when the technique of smelting iron ore with coke was introduced.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Samuel Morse's communication system was more reliable than that developed by William Cooke and Charles Wheatstone.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "The economic benefits of industrialisation were limited to certain sectors of society.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Some skilled weavers believed that the introduction of the new textile machines would lead to job losses.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "There was some sympathy among local people for the Luddites who were arrested near Huddersfield.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    # Passage 2: Athletes and stress
    p2_body = t2_txt[t2_txt.find("Athletes and stress"):t2_txt.find("Questions 14—18")].strip()
    p2_content = f"""You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

{p2_body}

Questions 14–18
Reading Passage 2 has six paragraphs, A–F.
Which paragraph contains the following information?
Write the correct letter, A–F, in boxes 14–18 on your answer sheet.
NB You may use any letter more than once.

14 reference to two chemical compounds which impact on performance
15 examples of strategies for minimising the effects of stress
16 how a sportsperson accounted for their own experience of stress
17 study results indicating links between stress responses and performance
18 mention of people who can influence how athletes perceive their stress responses

Questions 19–22
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 19–22 on your answer sheet.

19 Performance stress involves many demands on the athlete, for example, coping with the possible risk of ...............
20 Cortisol can cause tennis players to produce fewer good ...............
21 Psychologists can help athletes to view their physiological responses as the effect of a positive feeling such as ...............
22 ............... is an example of a psychological technique which can reduce an athlete's stress responses.

Questions 23 and 24
Choose TWO letters, A–E.
Write the correct letters in boxes 23 and 24 on your answer sheet.
Which TWO facts about Emma Raducanu's withdrawal from the Wimbledon tournament are mentioned in the text?
A the stage at which she dropped out of the tournament
B symptoms of her performance stress at the tournament
C measures which she had taken to manage her stress levels
D aspects of the Wimbledon tournament which increased her stress levels
E reactions to her social media posts about her experience at Wimbledon

Questions 25 and 26
Choose TWO letters, A–E.
Write the correct letters in boxes 25 and 26 on your answer sheet.
Which TWO facts about anxiety are mentioned in Paragraph E of the text?
A the factors which determine how severe it may be
B how long it takes for its effects to become apparent
C which of its symptoms is most frequently encountered
D the types of athletes who are most likely to suffer from it
E the harm that can result if athletes experience it too often"""

    p2_para_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEF"]
    q23_24_opts = [
        {"label": "A", "text": "the stage at which she dropped out of the tournament"},
        {"label": "B", "text": "symptoms of her performance stress at the tournament"},
        {"label": "C", "text": "measures which she had taken to manage her stress levels"},
        {"label": "D", "text": "aspects of the Wimbledon tournament which increased her stress levels"},
        {"label": "E", "text": "reactions to her social media posts about her experience at Wimbledon"},
    ]
    q25_26_opts = [
        {"label": "A", "text": "the factors which determine how severe it may be"},
        {"label": "B", "text": "how long it takes for its effects to become apparent"},
        {"label": "C", "text": "which of its symptoms is most frequently encountered"},
        {"label": "D", "text": "the types of athletes who are most likely to suffer from it"},
        {"label": "E", "text": "the harm that can result if athletes experience it too often"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "reference to two chemical compounds which impact on performance", "options": p2_para_opts}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "examples of strategies for minimising the effects of stress", "options": p2_para_opts}, "correctAnswer": "F"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "how a sportsperson accounted for their own experience of stress", "options": p2_para_opts}, "correctAnswer": "A"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "study results indicating links between stress responses and performance", "options": p2_para_opts}, "correctAnswer": "C"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "mention of people who can influence how athletes perceive their stress responses", "options": p2_para_opts}, "correctAnswer": "F"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "coping with the possible risk of ________", "blank": True}, "correctAnswer": "injury"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "Cortisol can cause tennis players to produce fewer good ________", "blank": True}, "correctAnswer": "serves"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "view their physiological responses as the effect of a positive feeling such as ________", "blank": True}, "correctAnswer": "excitement"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "________ is an example of a psychological technique which can reduce an athlete's stress responses.", "blank": True}, "correctAnswer": "Visualisation", "acceptableAnswers": ["Visualisation", "Visualization", "visualisation", "visualization"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO facts about Emma Raducanu's withdrawal from the Wimbledon tournament are mentioned in the text?", "options": q23_24_opts, "selectCount": 2, "covers": [23, 24]}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 23}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO facts about anxiety are mentioned in Paragraph E of the text?", "options": q25_26_opts, "selectCount": 2, "covers": [25, 26]}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 25}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
    ]

    # Passage 3: An ordinary genius (Maryam Mirzakhani / Eyre / Ericsson)
    p3_body = t2_txt[t2_txt.find("READING PASSAGE 3"):t2_txt.find("Questions 27—32")]
    # Strip the header
    p3_body = p3_body[p3_body.find("\n\n"):].strip()
    p3_content = f"""You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

{p3_body}

Questions 27–32
Complete the summary using the list of phrases, A–K, below.
Write the correct letter, A–K, in boxes 27–32 on your answer sheet.

Maryam Mirzakhani
Maryam Mirzakhani is regarded as 27 ............... in the field of mathematics because she was the only female holder of the prestigious Fields Medal — a record that she retained at the time of her death. However, maths held little 28 ............... for her as a child and in fact her performance was below average until she was 29 ............... by a difficult puzzle that one of her siblings showed her.
Later, as a professional mathematician, she had an inquiring mind and proved herself to be 30 ............... when things did not go smoothly. She said she got the greatest 31 ............... from making ground-breaking discoveries and in fact she was responsible for some extremely 32 ............... mathematical studies.

A appeal
B determined
C intrigued
D single
E achievement
F devoted
G involved
H unique
I innovative
J satisfaction
K intent

Questions 33–37
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 33–37 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

33 Many people who ended up winning prestigious intellectual prizes only reached an average standard when young.
34 Einstein's failures as a young man were due to his lack of confidence.
35 It is difficult to reach agreement on whether some children are actually born gifted.
36 Einstein was upset by the public's view of his life's work.
37 Einstein put his success down to the speed at which he dealt with scientific questions.

Questions 38–40
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 38–40 on your answer sheet.

38 What does Eyre believe is needed for children to equal 'gifted' standards?
A strict discipline from the teaching staff
B assistance from their peers in the classroom
C the development of a spirit of inquiry towards their studies
D the determination to surpass everyone else's achievements

39 What is the result of Ericsson's research?
A Very gifted students do not need to work on improving memory skills.
B Being born with a special gift is not the key factor in becoming expert.
C Including time for physical exercise is crucial in raising performance.
D 10,000 hours of relevant and demanding work will create a genius.

40 In the penultimate paragraph, it is stated the key to some deprived children's success is
A a regular and nourishing diet at home.
B the loving support of more than one parent.
C a community which has well-funded facilities for learning.
D the guidance of someone who recognises the benefits of learning."""

    q27_32_opts = [
        {"label": "A", "text": "appeal"},
        {"label": "B", "text": "determined"},
        {"label": "C", "text": "intrigued"},
        {"label": "D", "text": "single"},
        {"label": "E", "text": "achievement"},
        {"label": "F", "text": "devoted"},
        {"label": "G", "text": "involved"},
        {"label": "H", "text": "unique"},
        {"label": "I", "text": "innovative"},
        {"label": "J", "text": "satisfaction"},
        {"label": "K", "text": "intent"},
    ]
    y_n_ng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Maryam Mirzakhani is regarded as [27] in the field of mathematics", "options": q27_32_opts}, "correctAnswer": "H"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "However, maths held little [28] for her as a child", "options": q27_32_opts}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "until she was [29] by a difficult puzzle that one of her siblings showed her.", "options": q27_32_opts}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "proved herself to be [30] when things did not go smoothly.", "options": q27_32_opts}, "correctAnswer": "B"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "She said she got the greatest [31] from making ground-breaking discoveries", "options": q27_32_opts}, "correctAnswer": "J"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "responsible for some extremely [32] mathematical studies.", "options": q27_32_opts}, "correctAnswer": "I"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "Many people who ended up winning prestigious intellectual prizes only reached an average standard when young.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "Einstein's failures as a young man were due to his lack of confidence.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "It is difficult to reach agreement on whether some children are actually born gifted.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Einstein was upset by the public's view of his life's work.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Einstein put his success down to the speed at which he dealt with scientific questions.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
        {"number": 38, "order": 37, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Eyre believe is needed for children to equal 'gifted' standards?", "options": [{"label": "A", "text": "strict discipline from the teaching staff"}, {"label": "B", "text": "assistance from their peers in the classroom"}, {"label": "C", "text": "the development of a spirit of inquiry towards their studies"}, {"label": "D", "text": "the determination to surpass everyone else's achievements"}]}, "correctAnswer": "C"},
        {"number": 39, "order": 38, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the result of Ericsson's research?", "options": [{"label": "A", "text": "Very gifted students do not need to work on improving memory skills."}, {"label": "B", "text": "Being born with a special gift is not the key factor in becoming expert."}, {"label": "C", "text": "Including time for physical exercise is crucial in raising performance."}, {"label": "D", "text": "10,000 hours of relevant and demanding work will create a genius."}]}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the penultimate paragraph, it is stated the key to some deprived children's success is", "options": [{"label": "A", "text": "a regular and nourishing diet at home."}, {"label": "B", "text": "the loving support of more than one parent."}, {"label": "C", "text": "a community which has well-funded facilities for learning."}, {"label": "D", "text": "the guidance of someone who recognises the benefits of learning."}]}, "correctAnswer": "D"},
    ]

    reading_draft = {
        "title": "Test 20.C19.02 - Reading",
        "slug": "test-20-reading",
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
