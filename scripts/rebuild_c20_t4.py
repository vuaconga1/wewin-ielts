import json

def get_test_26_reading():
    with open("scripts/test4_raw.txt", encoding="utf-8") as f:
        text = f.read()
    pages = text.split("==================== PAGE ")
    page_dict = {int(p.split(" ====================")[0]): p.split(" ====================\n")[1] for p in pages[1:]}

    # Passage 1 - Georgia O'Keeffe
    p1_passage = f"{page_dict[68].strip()}\n\n{page_dict[69].strip()}\n\n{page_dict[70].strip()}"
    p1_tasks = """Questions 1-7
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.

The life and work of Georgia O'Keeffe

● studied art, then worked as a 1 ............... in various places in the USA
● created drawings using 2 ............... which were exhibited in New York City
● moved to New York and became famous for her paintings of the city's 3 ...............
● produced a series of innovative close-up paintings of 4 ...............
● went to New Mexico and was initially inspired to paint the many 5 ............... that could be found there
● continued to paint various features that together formed the dramatic 6 ............... of New Mexico for over forty years
● travelled widely by plane in later years, and painted pictures of clouds and 7 ............... seen from above

Questions 8-13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 8-13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.
9 When O'Keeffe finished high school, she had already made her mind up about the career that she wanted.
10 Alfred Stieglitz first discovered O'Keeffe's work when she sent some abstract drawings to his gallery in New York City.
11 O'Keeffe was the subject of Stieglitz's photographic work for many years.
12 O'Keeffe's paintings of the patio of her house in Abiquiú were among the artist's favourite works.
13 O'Keeffe produced a greater quantity of work during the 1950s to 1970s than at any other time in her life."""

    p1_questions = [
        {
            "number": 1,
            "order": 0,
            "type": "GAP_FILL",
            "content": {
                "stem": "studied art, then worked as a 1 ............... in various places in the USA",
                "blank": True
            },
            "correctAnswer": "teacher"
        },
        {
            "number": 2,
            "order": 1,
            "type": "GAP_FILL",
            "content": {
                "stem": "created drawings using 2 ............... which were exhibited in New York City",
                "blank": True
            },
            "correctAnswer": "charcoal"
        },
        {
            "number": 3,
            "order": 2,
            "type": "GAP_FILL",
            "content": {
                "stem": "moved to New York and became famous for her paintings of the city's 3 ...............",
                "blank": True
            },
            "correctAnswer": "skyscrapers"
        },
        {
            "number": 4,
            "order": 3,
            "type": "GAP_FILL",
            "content": {
                "stem": "produced a series of innovative close-up paintings of 4 ...............",
                "blank": True
            },
            "correctAnswer": "flowers"
        },
        {
            "number": 5,
            "order": 4,
            "type": "GAP_FILL",
            "content": {
                "stem": "went to New Mexico and was initially inspired to paint the many 5 ............... that could be found there",
                "blank": True
            },
            "correctAnswer": "bones"
        },
        {
            "number": 6,
            "order": 5,
            "type": "GAP_FILL",
            "content": {
                "stem": "continued to paint various features that together formed the dramatic 6 ............... of New Mexico for over forty years",
                "blank": True
            },
            "correctAnswer": "landscape",
            "acceptableAnswers": ["landscape", "scenery"]
        },
        {
            "number": 7,
            "order": 6,
            "type": "GAP_FILL",
            "content": {
                "stem": "travelled widely by plane in later years, and painted pictures of clouds and 7 ............... seen from above",
                "blank": True
            },
            "correctAnswer": "rivers"
        },
        {
            "number": 8,
            "order": 7,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "FALSE"
        },
        {
            "number": 9,
            "order": 8,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "When O'Keeffe finished high school, she had already made her mind up about the career that she wanted.",
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
                "stem": "Alfred Stieglitz first discovered O'Keeffe's work when she sent some abstract drawings to his gallery in New York City.",
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
                "stem": "O'Keeffe was the subject of Stieglitz's photographic work for many years.",
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
                "stem": "O'Keeffe's paintings of the patio of her house in Abiquiú were among the artist's favourite works.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "NOT GIVEN"
        },
        {
            "number": 13,
            "order": 12,
            "type": "TRUE_FALSE_NG",
            "content": {
                "stem": "O'Keeffe produced a greater quantity of work during the 1950s to 1970s than at any other time in her life.",
                "options": [
                    {"label": "TRUE", "text": "TRUE"},
                    {"label": "FALSE", "text": "FALSE"},
                    {"label": "NOT GIVEN", "text": "NOT GIVEN"}
                ]
            },
            "correctAnswer": "NOT GIVEN"
        }
    ]

    # Passage 2 - Adapting to the effects of climate change
    p2_passage = f"{page_dict[73].strip()}\n\n{page_dict[74].strip()}"
    p2_tasks = """Questions 14-17
Reading Passage 2 has six paragraphs, A-F.
Which paragraph contains the following information?

14 how a type of plant functions as a natural protection for coastlines
15 a prediction about how long it could take to stop noticing the effects of climate change
16 a reference to the fact that a solution is particularly cost-effective
17 a mention of a technology used to locate areas most in need of intervention

Questions 18-22
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.

18 The stormwater-management programme in Miami Beach has involved the installation of efficient 18 ...............
19 The construction of 19 ............... was the first stage of a project to ensure the success of mangroves in Indonesia.
20 As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can 20 ...............
21 Rising sea levels in Bangladesh have made it necessary to introduce various 21 ............... that are suitable for areas of high salt content.
22 A project in LA has increased the number of 22 ............... on the city's streets.

Questions 23-26
Look at the following statements (Questions 23-26) and the list of people below.
Match each statement with the correct person, A-E.

23 It is essential to adopt strategies which involve and help residents of the region.
24 Interventions which reduce heat are absolutely vital for our survival in this location.
25 More work will need to be done in future decades to deal with the impact of rising water levels.
26 The number of locations requiring action to adapt to flooding has grown in recent years.

List of People
A Yanira Pineda
B Susanna Tol
C Elizabeth English
D Raisa Chowdhury
E Greg Spotts"""

    p2_questions = [
        {
            "number": 14,
            "order": 0,
            "type": "MATCHING",
            "content": {
                "stem": "how a type of plant functions as a natural protection for coastlines",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"}
                ]
            },
            "correctAnswer": "D"
        },
        {
            "number": 15,
            "order": 1,
            "type": "MATCHING",
            "content": {
                "stem": "a prediction about how long it could take to stop noticing the effects of climate change",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 16,
            "order": 2,
            "type": "MATCHING",
            "content": {
                "stem": "a reference to the fact that a solution is particularly cost-effective",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 17,
            "order": 3,
            "type": "MATCHING",
            "content": {
                "stem": "a mention of a technology used to locate areas most in need of intervention",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"}
                ]
            },
            "correctAnswer": "F"
        },
        {
            "number": 18,
            "order": 4,
            "type": "GAP_FILL",
            "content": {
                "stem": "The stormwater-management programme in Miami Beach has involved the installation of efficient 18 ...............",
                "blank": True
            },
            "correctAnswer": "pumps"
        },
        {
            "number": 19,
            "order": 5,
            "type": "GAP_FILL",
            "content": {
                "stem": "The construction of 19 ............... was the first stage of a project to ensure the success of mangroves in Indonesia.",
                "blank": True
            },
            "correctAnswer": "dams"
        },
        {
            "number": 20,
            "order": 6,
            "type": "GAP_FILL",
            "content": {
                "stem": "As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can 20 ...............",
                "blank": True
            },
            "correctAnswer": "float"
        },
        {
            "number": 21,
            "order": 7,
            "type": "GAP_FILL",
            "content": {
                "stem": "Rising sea levels in Bangladesh have made it necessary to introduce various 21 ............... that are suitable for areas of high salt content.",
                "blank": True
            },
            "correctAnswer": "crops"
        },
        {
            "number": 22,
            "order": 8,
            "type": "GAP_FILL",
            "content": {
                "stem": "A project in LA has increased the number of 22 ............... on the city's streets.",
                "blank": True
            },
            "correctAnswer": "trees"
        },
        {
            "number": 23,
            "order": 9,
            "type": "MATCHING",
            "content": {
                "stem": "It is essential to adopt strategies which involve and help residents of the region.",
                "options": [
                    {"label": "A", "text": "Yanira Pineda"},
                    {"label": "B", "text": "Susanna Tol"},
                    {"label": "C", "text": "Elizabeth English"},
                    {"label": "D", "text": "Raisa Chowdhury"},
                    {"label": "E", "text": "Greg Spotts"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 24,
            "order": 10,
            "type": "MATCHING",
            "content": {
                "stem": "Interventions which reduce heat are absolutely vital for our survival in this location.",
                "options": [
                    {"label": "A", "text": "Yanira Pineda"},
                    {"label": "B", "text": "Susanna Tol"},
                    {"label": "C", "text": "Elizabeth English"},
                    {"label": "D", "text": "Raisa Chowdhury"},
                    {"label": "E", "text": "Greg Spotts"}
                ]
            },
            "correctAnswer": "E"
        },
        {
            "number": 25,
            "order": 11,
            "type": "MATCHING",
            "content": {
                "stem": "More work will need to be done in future decades to deal with the impact of rising water levels.",
                "options": [
                    {"label": "A", "text": "Yanira Pineda"},
                    {"label": "B", "text": "Susanna Tol"},
                    {"label": "C", "text": "Elizabeth English"},
                    {"label": "D", "text": "Raisa Chowdhury"},
                    {"label": "E", "text": "Greg Spotts"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 26,
            "order": 12,
            "type": "MATCHING",
            "content": {
                "stem": "The number of locations requiring action to adapt to flooding has grown in recent years.",
                "options": [
                    {"label": "A", "text": "Yanira Pineda"},
                    {"label": "B", "text": "Susanna Tol"},
                    {"label": "C", "text": "Elizabeth English"},
                    {"label": "D", "text": "Raisa Chowdhury"},
                    {"label": "E", "text": "Greg Spotts"}
                ]
            },
            "correctAnswer": "C"
        }
    ]

    # Passage 3 - A new role for livestock guard dogs
    p3_passage = f"{page_dict[77].strip()}\n\n{page_dict[78].strip()}"
    p3_tasks = """Questions 27-31
Reading Passage 3 has seven paragraphs, A-G.
Which paragraph contains the following information?
NB You may use any letter more than once.

27 an example of how one predator has been protected by the introduction of livestock guard dogs
28 an optimistic suggestion about the possible positive developments in the use of livestock guard dogs
29 a description of how the methods used by livestock guard dogs help to keep predators away
30 claims by different academics that the use of livestock guard dogs is a successful way of protecting farmers' herds
31 a reference to how livestock guard dogs gain their skills

Questions 32-36
Look at the following statements (Questions 32-36) and the list of people below.
Match each statement with the correct person, A-E.

32 The use of guard dogs may save the lives of both livestock and wild animals.
33 Claims of a change in behaviour from those using livestock guard dogs may not be totally accurate.
34 There may be negative results if the use of livestock guard dogs is not sufficiently widespread.
35 Livestock guard dogs are the best way of protecting farm animals, as long as the dogs are appropriately handled.
36 Teaching a livestock guard dog how to do its work needs a different focus from teaching a house guard dog.

List of People
A Dan Macon
B Silvia Ribeiro
C Linda van Bommel
D Julie Young
E Bethany Smith

Questions 37-40
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.

Unintended ecological effects of using guard dogs

In Namibia, livestock guard dogs have been used to protect domestic animals from attacks by cheetahs.

This has led to a rise in the deaths of other predators, particularly 37 ............... In addition, it has been suggested that the dogs could have 38 ..............., which may affect other species, and that they may reduce the amount of 39 ............... available to certain wild animals.

On the other hand, these dogs may help birds by protecting their nests. These might otherwise be threatened by predators such as 40 ..............."""

    p3_questions = [
        {
            "number": 27,
            "order": 0,
            "type": "MATCHING",
            "content": {
                "stem": "an example of how one predator has been protected by the introduction of livestock guard dogs",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"},
                    {"label": "G", "text": "Paragraph G"}
                ]
            },
            "correctAnswer": "D"
        },
        {
            "number": 28,
            "order": 1,
            "type": "MATCHING",
            "content": {
                "stem": "an optimistic suggestion about the possible positive developments in the use of livestock guard dogs",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"},
                    {"label": "G", "text": "Paragraph G"}
                ]
            },
            "correctAnswer": "G"
        },
        {
            "number": 29,
            "order": 2,
            "type": "MATCHING",
            "content": {
                "stem": "a description of how the methods used by livestock guard dogs help to keep predators away",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"},
                    {"label": "G", "text": "Paragraph G"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 30,
            "order": 3,
            "type": "MATCHING",
            "content": {
                "stem": "claims by different academics that the use of livestock guard dogs is a successful way of protecting farmers' herds",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"},
                    {"label": "G", "text": "Paragraph G"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 31,
            "order": 4,
            "type": "MATCHING",
            "content": {
                "stem": "a reference to how livestock guard dogs gain their skills",
                "options": [
                    {"label": "A", "text": "Paragraph A"},
                    {"label": "B", "text": "Paragraph B"},
                    {"label": "C", "text": "Paragraph C"},
                    {"label": "D", "text": "Paragraph D"},
                    {"label": "E", "text": "Paragraph E"},
                    {"label": "F", "text": "Paragraph F"},
                    {"label": "G", "text": "Paragraph G"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 32,
            "order": 5,
            "type": "MATCHING",
            "content": {
                "stem": "The use of guard dogs may save the lives of both livestock and wild animals.",
                "options": [
                    {"label": "A", "text": "Dan Macon"},
                    {"label": "B", "text": "Silvia Ribeiro"},
                    {"label": "C", "text": "Linda van Bommel"},
                    {"label": "D", "text": "Julie Young"},
                    {"label": "E", "text": "Bethany Smith"}
                ]
            },
            "correctAnswer": "D"
        },
        {
            "number": 33,
            "order": 6,
            "type": "MATCHING",
            "content": {
                "stem": "Claims of a change in behaviour from those using livestock guard dogs may not be totally accurate.",
                "options": [
                    {"label": "A", "text": "Dan Macon"},
                    {"label": "B", "text": "Silvia Ribeiro"},
                    {"label": "C", "text": "Linda van Bommel"},
                    {"label": "D", "text": "Julie Young"},
                    {"label": "E", "text": "Bethany Smith"}
                ]
            },
            "correctAnswer": "E"
        },
        {
            "number": 34,
            "order": 7,
            "type": "MATCHING",
            "content": {
                "stem": "There may be negative results if the use of livestock guard dogs is not sufficiently widespread.",
                "options": [
                    {"label": "A", "text": "Dan Macon"},
                    {"label": "B", "text": "Silvia Ribeiro"},
                    {"label": "C", "text": "Linda van Bommel"},
                    {"label": "D", "text": "Julie Young"},
                    {"label": "E", "text": "Bethany Smith"}
                ]
            },
            "correctAnswer": "B"
        },
        {
            "number": 35,
            "order": 8,
            "type": "MATCHING",
            "content": {
                "stem": "Livestock guard dogs are the best way of protecting farm animals, as long as the dogs are appropriately handled.",
                "options": [
                    {"label": "A", "text": "Dan Macon"},
                    {"label": "B", "text": "Silvia Ribeiro"},
                    {"label": "C", "text": "Linda van Bommel"},
                    {"label": "D", "text": "Julie Young"},
                    {"label": "E", "text": "Bethany Smith"}
                ]
            },
            "correctAnswer": "C"
        },
        {
            "number": 36,
            "order": 9,
            "type": "MATCHING",
            "content": {
                "stem": "Teaching a livestock guard dog how to do its work needs a different focus from teaching a house guard dog.",
                "options": [
                    {"label": "A", "text": "Dan Macon"},
                    {"label": "B", "text": "Silvia Ribeiro"},
                    {"label": "C", "text": "Linda van Bommel"},
                    {"label": "D", "text": "Julie Young"},
                    {"label": "E", "text": "Bethany Smith"}
                ]
            },
            "correctAnswer": "A"
        },
        {
            "number": 37,
            "order": 10,
            "type": "GAP_FILL",
            "content": {
                "stem": "This has led to a rise in the deaths of other predators, particularly 37 ...............",
                "blank": True
            },
            "correctAnswer": "jackals"
        },
        {
            "number": 38,
            "order": 11,
            "type": "GAP_FILL",
            "content": {
                "stem": "In addition, it has been suggested that the dogs could have 38 ..............., which may affect other species",
                "blank": True
            },
            "correctAnswer": "diseases",
            "acceptableAnswers": ["diseases", "disease"]
        },
        {
            "number": 39,
            "order": 12,
            "type": "GAP_FILL",
            "content": {
                "stem": "and that they may reduce the amount of 39 ............... available to certain wild animals.",
                "blank": True
            },
            "correctAnswer": "food"
        },
        {
            "number": 40,
            "order": 13,
            "type": "GAP_FILL",
            "content": {
                "stem": "These might otherwise be threatened by predators such as 40 ...............",
                "blank": True
            },
            "correctAnswer": "foxes"
        }
    ]

    return {
        "title": "Test 26.C20.04 - Reading",
        "slug": "test-26-reading",
        "skill": "READING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 60,
        "tags": ["Cambridge 20", "Academic", "Test 4", "Reading"],
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
