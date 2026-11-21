import json

def get_test_25_reading():
    with open("scripts/test3_raw.txt", encoding="utf-8") as f:
        text = f.read()
    pages = text.split("==================== PAGE ")
    page_dict = {int(p.split(" ====================")[0]): p.split(" ====================\n")[1] for p in pages[1:]}

    # Passage 1 - Frozen Food
    p1_passage = f"{page_dict[50].strip()}\n\n{page_dict[51].strip()}"
    p1_tasks = """Questions 1-7
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.

The history of frozen food

2,000 years ago, South America
● People conserved the nutritional value of 1 ............... , using a method of freezing then drying.

1851, USA
● 2 ............... was kept cool by ice during transportation in specially adapted trains.

1880, Australia
● Two kinds of 3 ............... were the first frozen food shipped to England.

1917 onwards, USA
● Clarence Birdseye introduced innovations including:
- quick-freezing methods, so that 4 ............... did not spoil the food.
- packaging products with 5 ..............., so the product was visible.

Early 1940s, USA
● Frozen food became popular because of a shortage of 6 ...............

1950s, USA
● A large number of homes now had a 7 ...............

Questions 8-13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 8-13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 The ice transportation business made some Boston ship owners very wealthy in the early 1800s.
9 A disadvantage of the freezing process invented in Australia was that it affected the taste of food.
10 Clarence Birdseye travelled to Labrador in order to learn how the Inuit people froze fish.
11 Swanson Foods invested a great deal of money in the promotion of the TV Dinner.
12 Swanson Foods developed a new style of container for the launch of the TV Dinner.
13 The US frozen food industry is currently the largest in the world."""

    p1_questions = [
        {
            "number": 1,
            "order": 0,
            "type": "GAP_FILL",
            "content": {
                "stem": "People conserved the nutritional value of 1 ............... , using a method of freezing then drying.",
                "blank": True
            },
            "correctAnswer": "potatoes"
        },
        {
            "number": 2,
            "order": 1,
            "type": "GAP_FILL",
            "content": {
                "stem": "2 ............... was kept cool by ice during transportation in specially adapted trains.",
                "blank": True
            },
            "correctAnswer": "butter"
        },
        {
            "number": 3,
            "order": 2,
            "type": "GAP_FILL",
            "content": {
                "stem": "Two kinds of 3 ............... were the first frozen food shipped to England.",
                "blank": True
            },
            "correctAnswer": "meat"
        },
        {
            "number": 4,
            "order": 3,
            "type": "GAP_FILL",
            "content": {
                "stem": "quick-freezing methods, so that 4 ............... did not spoil the food.",
                "blank": True
            },
            "correctAnswer": "crystals"
        },
        {
            "number": 5,
            "order": 4,
            "type": "GAP_FILL",
            "content": {
                "stem": "packaging products with 5 ..............., so the product was visible.",
                "blank": True
            },
            "correctAnswer": "cellophane"
        },
        {
            "number": 6,
            "order": 5,
            "type": "GAP_FILL",
            "content": {
                "stem": "Frozen food became popular because of a shortage of 6 ...............",
                "blank": True
            },
            "correctAnswer": "tin"
        },
        {
            "number": 7,
            "order": 6,
            "type": "GAP_FILL",
            "content": {
                "stem": "A large number of homes now had a 7 ...............",
                "blank": True
            },
            "correctAnswer": "refrigerator",
            "acceptableAnswers": ["refrigerator", "freezer"]
        },
        {
            "number": 8,
            "order": 7,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "The ice transportation business made some Boston ship owners very wealthy in the early 1800s.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "NOT GIVEN"
        },
        {
            "number": 9,
            "order": 8,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "A disadvantage of the freezing process invented in Australia was that it affected the taste of food.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "TRUE"
        },
        {
            "number": 10,
            "order": 9,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "Clarence Birdseye travelled to Labrador in order to learn how the Inuit people froze fish.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "FALSE"
        },
        {
            "number": 11,
            "order": 10,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "Swanson Foods invested a great deal of money in the promotion of the TV Dinner.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "TRUE"
        },
        {
            "number": 12,
            "order": 11,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "Swanson Foods developed a new style of container for the launch of the TV Dinner.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "FALSE"
        },
        {
            "number": 13,
            "order": 12,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "The US frozen food industry is currently the largest in the world.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "NOT GIVEN"
        }
    ]

    # Passage 2 - Can the planet's coral reefs be saved?
    p2_passage = f"{page_dict[55].strip()}\n\n{page_dict[56].strip()}"
    p2_tasks = """Questions 14-19
Reading Passage 2 has six sections, A-F.
Choose the correct heading for each section from the list of headings below.
Write the correct number, i-vii, in boxes 14-19 on your answer sheet.

List of Headings
i Tried and tested solutions
ii Cooperation beneath the waves
iii Working to lessen the problems
iv Disagreement about the accuracy of a certain phrase
v Two clear educational goals
vi Promoting hope
vii A warning of further trouble ahead

14 Section A
15 Section B
16 Section C
17 Section D
18 Section E
19 Section F

Questions 20 and 21
Choose TWO letters, A-E.
Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text?

A a rising number of extreme storms
B the removal of too many fish from the sea
C the contamination of the sea from waste
D increased disease among marine species
E alterations in the usual flow of water in the seas

Questions 22 and 23
Choose TWO letters, A-E.
Which TWO of the following statements are true of the researchers at London Zoo?

A They are hoping to expand the numbers of different corals being bred in laboratories.
B They want to identify corals that can cope well with the changed sea conditions.
C They are looking at ways of creating artificial reefs that corals could grow on.
D They are trying out methods that would speed up reproduction in some corals.
E They are investigating materials that might protect reefs from higher temperatures.

Questions 24-26
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.

24 Corals have a number of 24 ............... which they use to collect their food.
25 Algae gain 25 ............... from being inside the coral.
26 Increases in the warmth of the sea water can remove the 26 ............... from coral."""

    p2_questions = [
        {
            "number": 14,
            "order": 0,
            "type": "MATCHING",
            "content": {
                "stem": "Section A",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "v"
        },
        {
            "number": 15,
            "order": 1,
            "type": "MATCHING",
            "content": {
                "stem": "Section B",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "ii"
        },
        {
            "number": 16,
            "order": 2,
            "type": "MATCHING",
            "content": {
                "stem": "Section C",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "iv"
        },
        {
            "number": 17,
            "order": 3,
            "type": "MATCHING",
            "content": {
                "stem": "Section D",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "vii"
        },
        {
            "number": 18,
            "order": 4,
            "type": "MATCHING",
            "content": {
                "stem": "Section E",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "iii"
        },
        {
            "number": 19,
            "order": 5,
            "type": "MATCHING",
            "content": {
                "stem": "Section F",
                "options": [
                    {"label": "i", "text": "Tried and tested solutions"},
                    {"label": "ii", "text": "Cooperation beneath the waves"},
                    {"label": "iii", "text": "Working to lessen the problems"},
                    {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
                    {"label": "v", "text": "Two clear educational goals"},
                    {"label": "vi", "text": "Promoting hope"},
                    {"label": "vii", "text": "A warning of further trouble ahead"}
                ]
            },
            "correctAnswer": "vi"
        },
        {
            "number": 20,
            "order": 6,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text? (Question 20)",
                "options": [
                    {"label": "A", "text": "a rising number of extreme storms"},
                    {"label": "B", "text": "the removal of too many fish from the sea"},
                    {"label": "C", "text": "the contamination of the sea from waste"},
                    {"label": "D", "text": "increased disease among marine species"},
                    {"label": "E", "text": "alterations in the usual flow of water in the seas"}
                ]
            },
            "correctAnswer": "C",
            "acceptableAnswers": ["C", "E"]
        },
        {
            "number": 21,
            "order": 7,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text? (Question 21)",
                "options": [
                    {"label": "A", "text": "a rising number of extreme storms"},
                    {"label": "B", "text": "the removal of too many fish from the sea"},
                    {"label": "C", "text": "the contamination of the sea from waste"},
                    {"label": "D", "text": "increased disease among marine species"},
                    {"label": "E", "text": "alterations in the usual flow of water in the seas"}
                ]
            },
            "correctAnswer": "E",
            "acceptableAnswers": ["C", "E"]
        },
        {
            "number": 22,
            "order": 8,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "Which TWO of the following statements are true of the researchers at London Zoo? (Question 22)",
                "options": [
                    {"label": "A", "text": "They are hoping to expand the numbers of different corals being bred in laboratories."},
                    {"label": "B", "text": "They want to identify corals that can cope well with the changed sea conditions."},
                    {"label": "C", "text": "They are looking at ways of creating artificial reefs that corals could grow on."},
                    {"label": "D", "text": "They are trying out methods that would speed up reproduction in some corals."},
                    {"label": "E", "text": "They are investigating materials that might protect reefs from higher temperatures."}
                ]
            },
            "correctAnswer": "B",
            "acceptableAnswers": ["B", "D"]
        },
        {
            "number": 23,
            "order": 9,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "Which TWO of the following statements are true of the researchers at London Zoo? (Question 23)",
                "options": [
                    {"label": "A", "text": "They are hoping to expand the numbers of different corals being bred in laboratories."},
                    {"label": "B", "text": "They want to identify corals that can cope well with the changed sea conditions."},
                    {"label": "C", "text": "They are looking at ways of creating artificial reefs that corals could grow on."},
                    {"label": "D", "text": "They are trying out methods that would speed up reproduction in some corals."},
                    {"label": "E", "text": "They are investigating materials that might protect reefs from higher temperatures."}
                ]
            },
            "correctAnswer": "D",
            "acceptableAnswers": ["B", "D"]
        },
        {
            "number": 24,
            "order": 10,
            "type": "GAP_FILL",
            "content": {
                "stem": "Corals have a number of 24 ............... which they use to collect their food.",
                "blank": True
            },
            "correctAnswer": "tentacles"
        },
        {
            "number": 25,
            "order": 11,
            "type": "GAP_FILL",
            "content": {
                "stem": "Algae gain 25 ............... from being inside the coral.",
                "blank": True
            },
            "correctAnswer": "protection"
        },
        {
            "number": 26,
            "order": 12,
            "type": "GAP_FILL",
            "content": {
                "stem": "Increases in the warmth of the sea water can remove the 26 ............... from coral.",
                "blank": True
            },
            "correctAnswer": "colour",
            "acceptableAnswers": ["colour", "color"]
        }
    ]

    # Passage 3 - Robots and us
    # Page 60 lines before Questions 27-33 are footnotes
    p3_footnotes = """* terraforming: modifying a planet's atmosphere to suit human needs
** singularity: the point when robots will be able to start creating ever more sophisticated versions of themselves"""
    p3_passage = f"{page_dict[58].strip()}\n\n{page_dict[59].strip()}\n\n{p3_footnotes}"

    p3_tasks = """Questions 27-33
Look at the following statements (Questions 27-33) and the list of experts below.
Match each statement with the correct expert, A, B or C.
NB You may use any letter more than once.

27 For our own safety, humans will need to restrict the abilities of robots.
28 The risk of robots harming us is less serious than humans believe it to be.
29 It will take many decades for robot intelligence to be as imaginative as human intelligence.
30 We may have to start considering whether we are treating robots fairly.
31 Robots are probably of more help to us on Earth than in space.
32 The ideas in high-quality science fiction may prove to be just as accurate as those found in the work of mediocre scientists.
33 There are those who look forward to robots developing greater intelligence.

List of Experts
A Martin Rees
B Daniel Wolpert
C Kathleen Richardson

Questions 34-36
Complete each sentence with the correct ending, A-D, below.

A robots to explore outer space.
B advances made in machine intelligence so far.
C changes made to other planets for our own benefit.
D the harm already done by artificial intelligence

34 Richardson and Rees express similar views regarding the ethical aspect of ...............
35 Rees and Wolpert share an opinion about the extent of ...............
36 Wolpert disagrees with Richardson on the question of ...............

Questions 37-40
Choose the correct letter, A, B, C, or D.

37 What point does Richardson make about fear of machines?
A It has grown alongside the development of ever more advanced robots.
B It is the result of our inclination to attribute human characteristics to non-human entities.
C It has its origins in basic misunderstandings about how inanimate objects function.
D It demonstrates a key difference between human intelligence and machine intelligence.

38 What potential advance does Rees see as a cause for concern?
A robots outnumbering people
B robots having abilities which humans do not
C artificial intelligence developing independent thought
D artificial intelligence taking over every aspect of our lives

39 What does Wolpert emphasise in his response to the question about science fiction?
A how science fiction influences our attitudes to robots
B how fundamental robots are to the science fiction genre
C how the image of robots in science fiction has changed over time
D how reactions to similar portrayals of robots in science fiction may vary

40 What is Richardson doing in her comment about reality and fantasy?
A warning people not to confuse one with the other
B outlining ways in which one has impacted on the other
C recommending a change of approach in how people view them
D explaining why scientists have a different perspective on them from other people"""

    p3_questions = [
        {
            "number": 27,
            "order": 0,
            "type": "MATCHING",
            "content": {
                "stem": "For our own safety, humans will need to restrict the abilities of robots.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 28,
            "order": 1,
            "type": "MATCHING",
            "content": {
                "stem": "The risk of robots harming us is less serious than humans believe it to be.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 29,
            "order": 2,
            "type": "MATCHING",
            "content": {
                "stem": "It will take many decades for robot intelligence to be as imaginative as human intelligence.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 30,
            "order": 3,
            "type": "MATCHING",
            "content": {
                "stem": "We may have to start considering whether we are treating robots fairly.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 31,
            "order": 4,
            "type": "MATCHING",
            "content": {
                "stem": "Robots are probably of more help to us on Earth than in space.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 32,
            "order": 5,
            "type": "MATCHING",
            "content": {
                "stem": "The ideas in high-quality science fiction may prove to be just as accurate as those found in the work of mediocre scientists.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 33,
            "order": 6,
            "type": "MATCHING",
            "content": {
                "stem": "There are those who look forward to robots developing greater intelligence.",
                "options": [
                    {"label": "A", "text": "Martin Rees"},
                    {"label": "B", "text": "Daniel Wolpert"},
                    {"label": "C", "text": "Kathleen Richardson"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 34,
            "order": 7,
            "type": "MATCHING",
            "content": {
                "stem": "Richardson and Rees express similar views regarding the ethical aspect of ...............",
                "options": [
                    {"label": "A", "text": "robots to explore outer space."},
                    {"label": "B", "text": "advances made in machine intelligence so far."},
                    {"label": "C", "text": "changes made to other planets for our own benefit."},
                    {"label": "D", "text": "the harm already done by artificial intelligence"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 35,
            "order": 8,
            "type": "MATCHING",
            "content": {
                "stem": "Rees and Wolpert share an opinion about the extent of ...............",
                "options": [
                    {"label": "A", "text": "robots to explore outer space."},
                    {"label": "B", "text": "advances made in machine intelligence so far."},
                    {"label": "C", "text": "changes made to other planets for our own benefit."},
                    {"label": "D", "text": "the harm already done by artificial intelligence"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 36,
            "order": 9,
            "type": "MATCHING",
            "content": {
                "stem": "Wolpert disagrees with Richardson on the question of ...............",
                "options": [
                    {"label": "A", "text": "robots to explore outer space."},
                    {"label": "B", "text": "advances made in machine intelligence so far."},
                    {"label": "C", "text": "changes made to other planets for our own benefit."},
                    {"label": "D", "text": "the harm already done by artificial intelligence"}
                ]
            },
            "correctAnswer": "D"
        },
        {
            "number": 37,
            "order": 10,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "What point does Richardson make about fear of machines?",
                "options": [
                    {"label": "A", "text": "It has grown alongside the development of ever more advanced robots."},
                    {"label": "B", "text": "It is the result of our inclination to attribute human characteristics to non-human entities."},
                    {"label": "C", "text": "It has its origins in basic misunderstandings about how inanimate objects function."},
                    {"label": "D", "text": "It demonstrates a key difference between human intelligence and machine intelligence."}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 38,
            "order": 11,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "What potential advance does Rees see as a cause for concern?",
                "options": [
                    {"label": "A", "text": "robots outnumbering people"},
                    {"label": "B", "text": "robots having abilities which humans do not"},
                    {"label": "C", "text": "artificial intelligence developing independent thought"},
                    {"label": "D", "text": "artificial intelligence taking over every aspect of our lives"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 39,
            "order": 12,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "What does Wolpert emphasise in his response to the question about science fiction?",
                "options": [
                    {"label": "A", "text": "how science fiction influences our attitudes to robots"},
                    {"label": "B", "text": "how fundamental robots are to the science fiction genre"},
                    {"label": "C", "text": "how the image of robots in science fiction has changed over time"},
                    {"label": "D", "text": "how reactions to similar portrayals of robots in science fiction may vary"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 40,
            "order": 13,
            "type": "MULTIPLE_CHOICE",
            "content": {
                "stem": "What is Richardson doing in her comment about reality and fantasy?",
                "options": [
                    {"label": "A", "text": "warning people not to confuse one with the other"},
                    {"label": "B", "text": "outlining ways in which one has impacted on the other"},
                    {"label": "C", "text": "recommending a change of approach in how people view them"},
                    {"label": "D", "text": "explaining why scientists have a different perspective on them from other people"}
                ]
            },
            "correctAnswer": "C"
        }
    ]

    return {
        "title": "Test 25.C20.03 - Reading",
        "slug": "test-25-reading",
        "skill": "READING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 60,
        "tags": ["Cambridge 20", "Academic", "Test 3", "Reading"],
        "parts": [
            {
                "title": "Passage 1",
                "order": 0,
                "content": f"{p1_passage}\n\n{p1_tasks}",
                "questions": p1_questions
            },
            {
                "title": "Passage 2",
                "order": 1,
                "content": f"{p2_passage}\n\n{p2_tasks}",
                "questions": p2_questions
            },
            {
                "title": "Passage 3",
                "order": 2,
                "content": f"{p3_passage}\n\n{p3_tasks}",
                "questions": p3_questions
            }
        ]
    }
