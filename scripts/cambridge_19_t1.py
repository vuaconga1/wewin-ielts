# Test 19: Cambridge 19 Test 1 (Test 19.C19.01)
import json
import os

def get_test_19():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t1_txt_path = os.path.join(base_dir, "docs", "cambridge_19_split", "Cambridge_19_Part1_Trang_001-032_Intro_Test1.txt")
    with open(t1_txt_path, encoding="utf-8") as f:
        t1_txt = f.read()

    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Hinchingbrooke Country Park

The park
• Area: 1 ............... hectares
• Habitats: wetland, grassland and woodland
• Wetland: lakes, ponds and a 2 ...............
• Wildlife includes birds, insects and animals

Subjects studied in educational visits include
• Science: Children look at 3 ............... about plants, etc.
• Geography: includes learning to use a 4 ............... and compass
• History: changes in land use
• Leisure and tourism: mostly concentrates on the park's 5 ...............
• Music: Children make 6 ............... with natural materials, and experiment with rhythm and speed.

Benefits of outdoor educational visits
• They give children a feeling of 7 ............... that they may not have elsewhere.
• Children learn new 8 ............... and gain self-confidence.

Practical issues
• Cost per child: 9 £...............
• Adults, such as 10 ..............., free"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Area: ________ hectares", "blank": True}, "correctAnswer": "69", "acceptableAnswers": ["69", "sixty-nine", "sixty nine"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Wetland: lakes, ponds and a ________", "blank": True}, "correctAnswer": "stream"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Science: Children look at ________ about plants, etc.", "blank": True}, "correctAnswer": "data"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Geography: includes learning to use a ________ and compass", "blank": True}, "correctAnswer": "map"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Leisure and tourism: mostly concentrates on the park's ________", "blank": True}, "correctAnswer": "visitors"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Music: Children make ________ with natural materials", "blank": True}, "correctAnswer": "sounds"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "They give children a feeling of ________ that they may not have elsewhere.", "blank": True}, "correctAnswer": "freedom"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Children learn new ________ and gain self-confidence.", "blank": True}, "correctAnswer": "skills"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Cost per child: £________", "blank": True}, "correctAnswer": "4.95", "acceptableAnswers": ["4.95", "£4.95"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Adults, such as ________, free", "blank": True}, "correctAnswer": "leaders"},
    ]

    s2_content = """Questions 11–15
Choose the correct letter, A, B or C.

Stanthorpe Twinning Association
11 During the visit to Malatte, in France, members especially enjoyed
A going to a theme park.
B experiencing a river trip.
C visiting a cheese factory.

12 What will happen in Stanthorpe to mark the 25th anniversary of the Twinning Association?
A A tree will be planted.
B A garden seat will be bought.
C A footbridge will be built.

13 Which event raised most funds this year?
A the film show
B the pancake evening
C the cookery demonstration

14 For the first evening with the French visitors host families are advised to
A take them for a walk round the town.
B go to a local restaurant.
C have a meal at home.

15 On Saturday evening there will be the chance to
A listen to a concert.
B watch a match.
C take part in a competition.

Questions 16–20
Label the map below.
Write the correct letter, A–H, next to Questions 16–20.

![Farley House Map](/uploads/images/test-19-map.png)

16 Farm shop
17 Disabled entry
18 Adventure playground
19 Kitchen gardens
20 The Temple of the Four Winds"""

    map_opts = [{"label": c, "text": f"Location {c}"} for c in "ABCDEFGH"]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "During the visit to Malatte, in France, members especially enjoyed", "options": [{"label": "A", "text": "going to a theme park."}, {"label": "B", "text": "experiencing a river trip."}, {"label": "C", "text": "visiting a cheese factory."}]}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What will happen in Stanthorpe to mark the 25th anniversary of the Twinning Association?", "options": [{"label": "A", "text": "A tree will be planted."}, {"label": "B", "text": "A garden seat will be bought."}, {"label": "C", "text": "A footbridge will be built."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which event raised most funds this year?", "options": [{"label": "A", "text": "the film show"}, {"label": "B", "text": "the pancake evening"}, {"label": "C", "text": "the cookery demonstration"}]}, "correctAnswer": "B"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "For the first evening with the French visitors host families are advised to", "options": [{"label": "A", "text": "take them for a walk round the town."}, {"label": "B", "text": "go to a local restaurant."}, {"label": "C", "text": "have a meal at home."}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "On Saturday evening there will be the chance to", "options": [{"label": "A", "text": "listen to a concert."}, {"label": "B", "text": "watch a match."}, {"label": "C", "text": "take part in a competition."}]}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Farm shop", "options": map_opts}, "correctAnswer": "G"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Disabled entry", "options": map_opts}, "correctAnswer": "C"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Adventure playground", "options": map_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Kitchen gardens", "options": map_opts}, "correctAnswer": "D"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "The Temple of the Four Winds", "options": map_opts}, "correctAnswer": "A"},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO things did Colin find most satisfying about his bread reuse project?
A receiving support from local restaurants
B finding a good way to prevent waste
C overcoming problems in a basic process
D experimenting with designs and colours
E learning how to apply 3-D printing

Questions 23 and 24
Choose TWO letters, A–E.
Which TWO ways do the students agree that touch-sensitive sensors for food labels could be developed in future?
A for use on medical products
B to show that food is no longer fit to eat
C for use with drinks as well as foods
D to provide applications for blind people
E to indicate the weight of certain foods

Questions 25–30
What is the students' opinion about each of the following food trends?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 25–30.

Opinions
A This is only relevant to young people.
B This may have disappointing results.
C This already seems to be widespread.
D Retailers should do more to encourage this.
E More financial support is needed for this.
F Most people know little about this.
G There should be stricter regulations about this.
H This could be dangerous.

Food trends
25 Use of local products
26 Reduction in unnecessary packaging
27 Gluten-free and lactose-free food
28 Use of branded products related to celebrity chefs
29 Development of 'ghost kitchens' for takeaway food
30 Use of mushrooms for common health concerns"""

    q21_22_opts = [
        {"label": "A", "text": "receiving support from local restaurants"},
        {"label": "B", "text": "finding a good way to prevent waste"},
        {"label": "C", "text": "overcoming problems in a basic process"},
        {"label": "D", "text": "experimenting with designs and colours"},
        {"label": "E", "text": "learning how to apply 3-D printing"},
    ]
    q23_24_opts = [
        {"label": "A", "text": "for use on medical products"},
        {"label": "B", "text": "to show that food is no longer fit to eat"},
        {"label": "C", "text": "for use with drinks as well as foods"},
        {"label": "D", "text": "to provide applications for blind people"},
        {"label": "E", "text": "to indicate the weight of certain foods"},
    ]
    food_trend_opts = [
        {"label": "A", "text": "This is only relevant to young people."},
        {"label": "B", "text": "This may have disappointing results."},
        {"label": "C", "text": "This already seems to be widespread."},
        {"label": "D", "text": "Retailers should do more to encourage this."},
        {"label": "E", "text": "More financial support is needed for this."},
        {"label": "F", "text": "Most people know little about this."},
        {"label": "G", "text": "There should be stricter regulations about this."},
        {"label": "H", "text": "This could be dangerous."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things did Colin find most satisfying about his bread reuse project?", "options": q21_22_opts, "selectCount": 2, "covers": [21, 22]}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 21}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO ways do the students agree that touch-sensitive sensors for food labels could be developed in future?", "options": q23_24_opts, "selectCount": 2, "covers": [23, 24]}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 23}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Use of local products", "options": food_trend_opts}, "correctAnswer": "D"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Reduction in unnecessary packaging", "options": food_trend_opts}, "correctAnswer": "G"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Gluten-free and lactose-free food", "options": food_trend_opts}, "correctAnswer": "C"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Use of branded products related to celebrity chefs", "options": food_trend_opts}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Development of 'ghost kitchens' for takeaway food", "options": food_trend_opts}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Use of mushrooms for common health concerns", "options": food_trend_opts}, "correctAnswer": "H"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Céide Fields
an important Neolithic archaeological site in the northwest of Ireland

Discovery
• In the 1930s, a local teacher realised that stones beneath the bog surface were once 31 ...............
• His 32 ............... became an archaeologist and undertook an investigation of the site:
  — a traditional method used by local people to dig for 33 ............... was used to identify where stones were located
  — carbon dating later proved the site was Neolithic.
• Items are well preserved in the bog because of a lack of 34 ...............

Neolithic farmers
• Houses were 35 ............... in shape and had a hole in the roof.
• Neolithic innovations include:
  — pots used for storage and to make 36 ...............
  — cooking indoors
• Each field at Céide was large enough to support a big 37 ...............
• The fields were probably used to restrict the grazing of animals — no evidence of structures to house them during 38 ...............

Reasons for the decline in farming
• a decline in 39 ............... quality
• an increase in 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "In the 1930s, a local teacher realised that stones beneath the bog surface were once ________", "blank": True}, "correctAnswer": "walls"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "His ________ became an archaeologist and undertook an investigation of the site", "blank": True}, "correctAnswer": "son"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "a traditional method used by local people to dig for ________ was used to identify where stones were located", "blank": True}, "correctAnswer": "fuel"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Items are well preserved in the bog because of a lack of ________", "blank": True}, "correctAnswer": "oxygen"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Houses were ________ in shape and had a hole in the roof.", "blank": True}, "correctAnswer": "rectangular"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "pots used for storage and to make ________", "blank": True}, "correctAnswer": "lamps"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Each field at Céide was large enough to support a big ________", "blank": True}, "correctAnswer": "family"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "no evidence of structures to house them during ________", "blank": True}, "correctAnswer": "winter"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "a decline in ________ quality", "blank": True}, "correctAnswer": "soil"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "an increase in ________", "blank": True}, "correctAnswer": "rain"},
    ]

    listening_draft = {
        "title": "Test 19.C19.01 - Listening",
        "slug": "test-19-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-19-section-1.mp3",
            "/uploads/audio/test-19-section-2.mp3",
            "/uploads/audio/test-19-section-3.mp3",
            "/uploads/audio/test-19-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-19-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-19-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-19-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-19-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    # Passage 1: How tennis rackets have changed
    p1_body = t1_txt[t1_txt.find("How tennis rackets have changed"):t1_txt.find("Questions 1—7")].strip()
    p1_content = f"""You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

{p1_body}

Questions 1–7
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–7 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.
2 The change that Andy Murray made to his rackets attracted a lot of attention.
3 Most of the world's top players take a professional racket stringer on tour with them.
4 Mike and Bob Bryan use rackets that are light in comparison to the majority of rackets.
5 Werner Fischer played with a spaghetti-strung racket that he designed himself.
6 The weather can affect how professional players adjust the strings on their rackets.
7 It was believed that the change Pete Sampras made to his rackets contributed to his strong serve.

Questions 8–13
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 8–13 on your answer sheet.

The tennis racket and how it has changed
• Mike and Bob Bryan made changes to the types of 8 ............... used on their racket frames.
• Players were not allowed to use the spaghetti-strung racket because of the amount of 9 ............... it created.
• Changes to rackets can be regarded as being as important as players' diets or the 10 ............... they do.
• All rackets used to have natural strings made from the 11 ............... of animals.
• Pete Sampras had metal 12 ............... put into the frames of his rackets.
• Gonçalo Oliveira changed the 13 ............... on his racket handles."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "People had expected Andy Murray to become the world's top tennis player for at least five years before 2016.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "The change that Andy Murray made to his rackets attracted a lot of attention.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "Most of the world's top players take a professional racket stringer on tour with them.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Mike and Bob Bryan use rackets that are light in comparison to the majority of rackets.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "Werner Fischer played with a spaghetti-strung racket that he designed himself.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "The weather can affect how professional players adjust the strings on their rackets.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "It was believed that the change Pete Sampras made to his rackets contributed to his strong serve.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Mike and Bob Bryan made changes to the types of ________ used on their racket frames.", "blank": True}, "correctAnswer": "paint"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Players were not allowed to use the spaghetti-strung racket because of the amount of ________ it created.", "blank": True}, "correctAnswer": "topspin"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Changes to rackets can be regarded as being as important as players' diets or the ________ they do.", "blank": True}, "correctAnswer": "training"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "All rackets used to have natural strings made from the ________ of animals.", "blank": True}, "correctAnswer": "intestines", "acceptableAnswers": ["intestines", "gut", "intestines / gut", "intestines/gut"]},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "Pete Sampras had metal ________ put into the frames of his rackets.", "blank": True}, "correctAnswer": "weights"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "Gonçalo Oliveira changed the ________ on his racket handles.", "blank": True}, "correctAnswer": "grips"},
    ]

    # Passage 2: The pirates of the ancient Mediterranean
    p2_body = t1_txt[t1_txt.find("The pirates of the ancient Mediterranean"):t1_txt.find("Questions 14—19")].strip()
    p2_content = f"""You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

{p2_body}

Questions 14–19
Reading Passage 2 has seven paragraphs, A–G.
Which paragraph contains the following information?
Write the correct letter, A–G, in boxes 14–19 on your answer sheet.
NB You may use any letter more than once.

14 a reference to a denial of involvement in piracy
15 details of how a campaign to eradicate piracy was carried out
16 a mention of the circumstances in which states in the ancient world would make use of pirates
17 a reference to how people today commonly view pirates
18 an explanation of how some people were encouraged not to return to piracy
19 a mention of the need for many sailing vessels to stay relatively close to land

Questions 20 and 21
Choose TWO letters, A–E.
Write the correct letters in boxes 20 and 21 on your answer sheet.
Which TWO of the following statements does the writer make about inhabitants of the Mediterranean region in the ancient world?
A They often used stolen vessels to carry out pirate attacks.
B They managed to escape capture by the authorities because they knew the area so well.
C They paid for information about the routes merchant ships would take.
D They depended more on the sea for their livelihood than on farming.
E They stored many of the goods taken in pirate attacks in coves along the coastline.

Questions 22 and 23
Choose TWO letters, A–E.
Write the correct letters in boxes 22 and 23 on your answer sheet.
Which TWO of the following statements does the writer make about piracy and ancient Greece?
A The state estimated that very few people were involved in piracy.
B Attitudes towards piracy changed shortly after the Iliad and the Odyssey were written.
C Important officials were known to occasionally take part in piracy.
D Every citizen regarded pirate attacks on cities as unacceptable.
E A favourable view of piracy is evident in certain ancient Greek texts.

Questions 24–26
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 24–26 on your answer sheet.

Ancient Rome and piracy
Piracy was an issue ancient Rome had to deal with, but it also brought some benefits for Rome. For example, pirates supplied slaves that were important for Rome's industries. However, attacks on vessels transporting 24 ............... to Rome resulted in calls for 25 ............... for the pirates responsible. Nevertheless, piracy continued, with some pirates demanding a 26 ............... for the return of the Roman officials they captured."""

    para_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEFG"]
    q20_21_opts = [
        {"label": "A", "text": "They often used stolen vessels to carry out pirate attacks."},
        {"label": "B", "text": "They managed to escape capture by the authorities because they knew the area so well."},
        {"label": "C", "text": "They paid for information about the routes merchant ships would take."},
        {"label": "D", "text": "They depended more on the sea for their livelihood than on farming."},
        {"label": "E", "text": "They stored many of the goods taken in pirate attacks in coves along the coastline."},
    ]
    q22_23_opts = [
        {"label": "A", "text": "The state estimated that very few people were involved in piracy."},
        {"label": "B", "text": "Attitudes towards piracy changed shortly after the Iliad and the Odyssey were written."},
        {"label": "C", "text": "Important officials were known to occasionally take part in piracy."},
        {"label": "D", "text": "Every citizen regarded pirate attacks on cities as unacceptable."},
        {"label": "E", "text": "A favourable view of piracy is evident in certain ancient Greek texts."},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "a reference to a denial of involvement in piracy", "options": para_opts}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "details of how a campaign to eradicate piracy was carried out", "options": para_opts}, "correctAnswer": "G"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "a mention of the circumstances in which states in the ancient world would make use of pirates", "options": para_opts}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a reference to how people today commonly view pirates", "options": para_opts}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "an explanation of how some people were encouraged not to return to piracy", "options": para_opts}, "correctAnswer": "G"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "a mention of the need for many sailing vessels to stay relatively close to land", "options": para_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about inhabitants of the Mediterranean region in the ancient world?", "options": q20_21_opts, "selectCount": 2, "covers": [20, 21]}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 20}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements does the writer make about piracy and ancient Greece?", "options": q22_23_opts, "selectCount": 2, "covers": [22, 23]}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "", "pairedFrom": 22}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "However, attacks on vessels transporting ________ to Rome resulted in calls for punishment", "blank": True}, "correctAnswer": "grain"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "resulted in calls for ________ for the pirates responsible", "blank": True}, "correctAnswer": "punishment"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "with some pirates demanding a ________ for the return of the Roman officials they captured", "blank": True}, "correctAnswer": "ransom"},
    ]

    # Passage 3: The persistence and peril of misinformation
    p3_body = t1_txt[t1_txt.find("The persistence and peril of misinformation"):t1_txt.find("Questions 27—30")].strip()
    p3_content = f"""You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

{p3_body}

Questions 27–30
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–30 on your answer sheet.

27 What point does the writer make about misinformation in the first paragraph?
A Misinformation is a relatively recent phenomenon.
B Some people find it easy to identify misinformation.
C Misinformation changes as it is passed from one person to another.
D There may be a number of reasons for the spread of misinformation.

28 What does the writer say about the role of technology?
A It may at some point provide us with a solution to misinformation.
B It could fundamentally alter the way in which people regard information.
C It has changed the way in which organisations use misinformation.
D It has made it easier for people to check whether information is accurate.

29 What is the writer doing in the fourth paragraph?
A comparing the different opinions people have of misinformation
B explaining how the effects of misinformation have changed over time
C outlining which issues connected with misinformation are significant today
D describing the attitude of policy makers towards misinformation in the media

30 What point does the writer make about regulation in the USA?
A The guidelines issued by the FDA need to be simplified.
B Regulation does not affect people's opinions of new prescription drugs.
C The USA has more regulatory bodies than most other countries.
D Regulation fails to prevent misinformation from appearing in the media.

Questions 31–36
Complete the summary using the list of phrases, A–J, below.
Write the correct letter, A–J, in boxes 31–36 on your answer sheet.

What happens when people encounter misinformation?
Although people have 31 ............... to misinformation, there is debate about precisely how and when we label something as true or untrue. The philosophers Descartes and Spinoza had 32 ............... about how people engage with information. While Descartes believed that people accept or reject information after considering whether it is true or not, Spinoza argued that people accepted all information they encountered (and by default misinformation) and did not verify or reject it until afterwards. Moreover, Spinoza believed that a distinct 33 ............... is involved in these stages. Recent research has provided 34 ............... for Spinoza's theory and it would appear that people accept all encountered information as if it were true, even if this is for an extremely 35 ..............., and do not label the information as true or false until later. This is consistent with the fact that the resources for scepticism and the resources for perceiving and encoding are in 36 ............... in the brain.

A constant conflict
B additional evidence
C different locations
D experimental subjects
E short period
F extreme distrust
G frequent exposure
H mental operation
I dubious reason
J different ideas

Questions 37–40
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 37–40 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

37 Campaigns designed to correct misinformation will fail to achieve their purpose if people are unable to understand them.
38 Attempts to teach elementary school students about misinformation have been opposed.
39 It may be possible to overcome the problem of misinformation in a relatively short period.
40 The need to keep up with new information is hugely exaggerated in today's world."""

    q31_36_opts = [
        {"label": "A", "text": "constant conflict"},
        {"label": "B", "text": "additional evidence"},
        {"label": "C", "text": "different locations"},
        {"label": "D", "text": "experimental subjects"},
        {"label": "E", "text": "short period"},
        {"label": "F", "text": "extreme distrust"},
        {"label": "G", "text": "frequent exposure"},
        {"label": "H", "text": "mental operation"},
        {"label": "I", "text": "dubious reason"},
        {"label": "J", "text": "different ideas"},
    ]
    y_n_ng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about misinformation in the first paragraph?", "options": [{"label": "A", "text": "Misinformation is a relatively recent phenomenon."}, {"label": "B", "text": "Some people find it easy to identify misinformation."}, {"label": "C", "text": "Misinformation changes as it is passed from one person to another."}, {"label": "D", "text": "There may be a number of reasons for the spread of misinformation."}]}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer say about the role of technology?", "options": [{"label": "A", "text": "It may at some point provide us with a solution to misinformation."}, {"label": "B", "text": "It could fundamentally alter the way in which people regard information."}, {"label": "C", "text": "It has changed the way in which organisations use misinformation."}, {"label": "D", "text": "It has made it easier for people to check whether information is accurate."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer doing in the fourth paragraph?", "options": [{"label": "A", "text": "comparing the different opinions people have of misinformation"}, {"label": "B", "text": "explaining how the effects of misinformation have changed over time"}, {"label": "C", "text": "outlining which issues connected with misinformation are significant today"}, {"label": "D", "text": "describing the attitude of policy makers towards misinformation in the media"}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about regulation in the USA?", "options": [{"label": "A", "text": "The guidelines issued by the FDA need to be simplified."}, {"label": "B", "text": "Regulation does not affect people's opinions of new prescription drugs."}, {"label": "C", "text": "The USA has more regulatory bodies than most other countries."}, {"label": "D", "text": "Regulation fails to prevent misinformation from appearing in the media."}]}, "correctAnswer": "D"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Although people have [31] to misinformation", "options": q31_36_opts}, "correctAnswer": "G"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "The philosophers Descartes and Spinoza had [32] about how people engage with information.", "options": q31_36_opts}, "correctAnswer": "J"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "Moreover, Spinoza believed that a distinct [33] is involved in these stages.", "options": q31_36_opts}, "correctAnswer": "H"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Recent research has provided [34] for Spinoza's theory", "options": q31_36_opts}, "correctAnswer": "B"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "even if this is for an extremely [35]", "options": q31_36_opts}, "correctAnswer": "E"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "are in [36] in the brain.", "options": q31_36_opts}, "correctAnswer": "C"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Campaigns designed to correct misinformation will fail to achieve their purpose if people are unable to understand them.", "options": y_n_ng_opts}, "correctAnswer": "YES"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "Attempts to teach elementary school students about misinformation have been opposed.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "It may be possible to overcome the problem of misinformation in a relatively short period.", "options": y_n_ng_opts}, "correctAnswer": "NO"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "The need to keep up with new information is hugely exaggerated in today's world.", "options": y_n_ng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    reading_draft = {
        "title": "Test 19.C19.01 - Reading",
        "slug": "test-19-reading",
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
