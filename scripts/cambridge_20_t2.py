# Test 24: Cambridge 20 Test 2 (Test 24.C20.02)
import json
import os

def get_test_24():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Support for Carers
Local councils can arrange practical support to help those caring for elderly people at home.

This can give the carer:
● time for other responsibilities
● a 1 ...............

Assessment of mother's needs
This may include discussion of:
● how much 2 ............... the caring involves
● what types of tasks are involved, e.g.
  - help with dressing
  - helping her have a 3 ...............
  - shopping
  - helping with meals
  - dealing with 4 ...............
● any aspects of caring that are especially difficult, e.g.
  - loss of 5 ...............
  - 6 ............... her
  - preventing a 7 ...............

Types of support that may be offered to carers
● transport costs, e.g. cost of a 8 ...............
● car-related costs, e.g. fuel and 9 ...............
● help with housework
● help to reduce 10 ..............."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "This can give the carer: a ________", "blank": True}, "correctAnswer": "break"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "how much ________ the caring involves", "blank": True}, "correctAnswer": "time"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "helping her have a ________", "blank": True}, "correctAnswer": "shower"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "dealing with ________", "blank": True}, "correctAnswer": "money"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "loss of ________", "blank": True}, "correctAnswer": "memory"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "________ her", "blank": True}, "correctAnswer": "lifting"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "preventing a ________", "blank": True}, "correctAnswer": "fall"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "transport costs, e.g. cost of a ________", "blank": True}, "correctAnswer": "taxi"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "car-related costs, e.g. fuel and ________", "blank": True}, "correctAnswer": "insurance"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "help to reduce ________", "blank": True}, "correctAnswer": "stress"},
    ]

    s2_content = """Questions 11–16
What is the role of the volunteers in each of the following activities?
Choose SIX answers from the box and write the correct letter, A–I, next to Questions 11–16.

Roles
A providing entertainment
B providing publicity about a council service
C contacting local businesses
D giving advice to visitors
E collecting feedback on events
F selling tickets
G introducing guest speakers at an event
H encouraging cooperation between local organisations
I arranging displays

11 Welcome tent
12 Exhibition tent
13 Community tent
14 Main entrance
15 Children's area
16 Town hall

Questions 17–20
Choose the correct letter, A, B or C.

17 Which event requires the largest number of volunteers?
A the music festival
B the science festival
C the book festival

18 What is the most important requirement for volunteers at the festivals?
A interpersonal skills
B personal interest in the event
C flexibility

19 New volunteers will start working in the week beginning
A 2 September.
B 9 September.
C 23 September.

20 What is the next annual event for volunteers?
A a boat trip
B a barbecue
C a party"""

    role_opts = [
        {"label": "A", "text": "providing entertainment"},
        {"label": "B", "text": "providing publicity about a council service"},
        {"label": "C", "text": "contacting local businesses"},
        {"label": "D", "text": "giving advice to visitors"},
        {"label": "E", "text": "collecting feedback on events"},
        {"label": "F", "text": "selling tickets"},
        {"label": "G", "text": "introducing guest speakers at an event"},
        {"label": "H", "text": "encouraging cooperation between local organisations"},
        {"label": "I", "text": "arranging displays"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MATCHING", "content": {"stem": "Welcome tent", "options": role_opts}, "correctAnswer": "D"},
        {"number": 12, "order": 11, "type": "MATCHING", "content": {"stem": "Exhibition tent", "options": role_opts}, "correctAnswer": "I"},
        {"number": 13, "order": 12, "type": "MATCHING", "content": {"stem": "Community tent", "options": role_opts}, "correctAnswer": "H"},
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Main entrance", "options": role_opts}, "correctAnswer": "E"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Children's area", "options": role_opts}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Town hall", "options": role_opts}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which event requires the largest number of volunteers?", "options": [{"label": "A", "text": "the music festival"}, {"label": "B", "text": "the science festival"}, {"label": "C", "text": "the book festival"}]}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the most important requirement for volunteers at the festivals?", "options": [{"label": "A", "text": "interpersonal skills"}, {"label": "B", "text": "personal interest in the event"}, {"label": "C", "text": "flexibility"}]}, "correctAnswer": "A"},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "New volunteers will start working in the week beginning", "options": [{"label": "A", "text": "2 September."}, {"label": "B", "text": "9 September."}, {"label": "C", "text": "23 September."}]}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the next annual event for volunteers?", "options": [{"label": "A", "text": "a boat trip"}, {"label": "B", "text": "a barbecue"}, {"label": "C", "text": "a party"}]}, "correctAnswer": "A"},
    ]

    s3_content = """Questions 21–25
What is Rosie and Colin's opinion about each of the following aspects of human geography?
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 21–25.

Opinions
A The information given about this was too vague.
B This may not be relevant to their course.
C This will involve only a small number of statistics.
D It will be easy to find facts about this.
E The facts about this may not be reliable.
F No useful research has been done on this.
G The information provided about this was interesting.

Aspects of human geography
21 Population
22 Health
23 Economies
24 Culture
25 Poverty

Questions 26–30
Choose the correct letter, A, B or C.

26 Rosie says that in her own city the main problem is
A crime.
B housing.
C unemployment.

27 What recent additions to the outskirts of their cities are both students happy about?
A conference centres
B sports centres
C retail centres

28 The students agree that developing disused industrial sites may
A have unexpected costs.
B damage the urban environment.
C destroy valuable historical buildings.

29 The students will mention Masdar City as an example of an attempt to achieve
A daily collections for waste recycling.
B sustainable energy use.
C free transport for everyone.

30 When discussing the ecotown of Greenhill Abbots, Colin is uncertain about
A what its objectives were.
B why there was opposition to it.
C how much of it has actually been built."""

    geog_opts = [
        {"label": "A", "text": "The information given about this was too vague."},
        {"label": "B", "text": "This may not be relevant to their course."},
        {"label": "C", "text": "This will involve only a small number of statistics."},
        {"label": "D", "text": "It will be easy to find facts about this."},
        {"label": "E", "text": "The facts about this may not be reliable."},
        {"label": "F", "text": "No useful research has been done on this."},
        {"label": "G", "text": "The information provided about this was interesting."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "Population", "options": geog_opts}, "correctAnswer": "D"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "Health", "options": geog_opts}, "correctAnswer": "G"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "Economies", "options": geog_opts}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "Culture", "options": geog_opts}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Poverty", "options": geog_opts}, "correctAnswer": "E"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Rosie says that in her own city the main problem is", "options": [{"label": "A", "text": "crime."}, {"label": "B", "text": "housing."}, {"label": "C", "text": "unemployment."}]}, "correctAnswer": "C"},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "What recent additions to the outskirts of their cities are both students happy about?", "options": [{"label": "A", "text": "conference centres"}, {"label": "B", "text": "sports centres"}, {"label": "C", "text": "retail centres"}]}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students agree that developing disused industrial sites may", "options": [{"label": "A", "text": "have unexpected costs."}, {"label": "B", "text": "damage the urban environment."}, {"label": "C", "text": "destroy valuable historical buildings."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students will mention Masdar City as an example of an attempt to achieve", "options": [{"label": "A", "text": "daily collections for waste recycling."}, {"label": "B", "text": "sustainable energy use."}, {"label": "C", "text": "free transport for everyone."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "When discussing the ecotown of Greenhill Abbots, Colin is uncertain about", "options": [{"label": "A", "text": "what its objectives were."}, {"label": "B", "text": "why there was opposition to it."}, {"label": "C", "text": "how much of it has actually been built."}]}, "correctAnswer": "C"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Developing food trends
● The growth in interest in food fashions started with 31 ............... of food being shared on social media.
● The UK food industry is constantly developing products which are new or different.
● Influencers on social media become 'ambassadors' for a brand.
  - Sales of 32 ............... food brands have grown rapidly this way.
● Supermarkets track demand for ingredients on social media.
  - Famous 33 ............... are influential.

Marketing campaigns
● The avocado:
  - 34 ............... were invited to visit growers in South Africa.
  - Advertising focused on its 35 ............... benefits.
● Oat milk:
  - A Swedish brand's media campaign received publicity by upsetting competitors.
  - Promotion in the USA through 36 ............... shops reduced the need for advertising.
  - It appealed to consumers who are concerned about the 37 ...............
● Norwegian skrei:
  - has helped strengthen the 38 ............... of Norwegian seafood.

Ethical concerns
● Quinoa:
  - Its success led to an increase in its 39 ...............
  - Overuse of resources resulted in poor quality 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "started with ________ of food being shared on social media.", "blank": True}, "correctAnswer": "photos", "acceptableAnswers": ["photos", "photographs", "pictures"]},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "Sales of ________ food brands have grown rapidly this way.", "blank": True}, "correctAnswer": "vegan"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Famous ________ are influential.", "blank": True}, "correctAnswer": "chefs", "acceptableAnswers": ["chefs", "cooks"]},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "________ were invited to visit growers in South Africa.", "blank": True}, "correctAnswer": "journalists", "acceptableAnswers": ["journalists", "reporters"]},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Advertising focused on its ________ benefits.", "blank": True}, "correctAnswer": "health"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Promotion in the USA through ________ shops reduced the need for advertising.", "blank": True}, "correctAnswer": "coffee"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "consumers who are concerned about the ________", "blank": True}, "correctAnswer": "environment"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "strengthen the ________ of Norwegian seafood.", "blank": True}, "correctAnswer": "reputation"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Its success led to an increase in its ________", "blank": True}, "correctAnswer": "price", "acceptableAnswers": ["price", "cost"]},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "resulted in poor quality ________", "blank": True}, "correctAnswer": "soil"},
    ]

    listening_draft = {
        "title": "Test 24.C20.02 - Listening",
        "slug": "test-24-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-24-section-1.m4a",
            "/uploads/audio/test-24-section-2.m4a",
            "/uploads/audio/test-24-section-3.m4a",
            "/uploads/audio/test-24-section-4.m4a",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-24-section-1.m4a"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-24-section-2.m4a"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-24-section-3.m4a"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-24-section-4.m4a"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

Manatees
Manatees, also known as sea cows, are aquatic mammals that belong to a group of animals called Sirenia. They are large, slow-moving creatures that spend their lives in the warm shallow coastal waters, rivers, and estuaries of the tropics and subtropics.

There are three living species of manatees: the West Indian manatee (Trichechus manatus), the African manatee (Trichechus senegalensis), and the Amazonian manatee (Trichechus inunguis). Although they look very similar to dugongs, which belong to the same order, manatees are distinguished by their paddle-shaped tail, whereas dugongs have a fluked tail resembling that of a whale.

Manatees have stout, cylindrical bodies with thick wrinkled skin covered in sparsely distributed sensory hairs. These hairs allow them to sense vibrations and navigate in murky waters. They have flexible front flippers that are used for steering and bringing food to their mouths, but they have no hind limbs. Unlike most mammals, which have seven neck vertebrae, manatees have only six, meaning they must turn their entire body to look sideways.

Manatees are herbivores that consume a wide range of submerged, floating, and emergent vegetation, primarily seagrasses. Adult manatees can eat between four and nine percent of their body weight in wet vegetation daily. To gather their food, they rely on their flexible, muscular prehensile lips to tear plants from the riverbed or seabed.

Because they are mammals, manatees must surface to breathe air. While resting, they can remain submerged for up to twenty minutes, but during active swimming they surface every two to four minutes. Manatees regulate their buoyancy using their dense, heavy bones and large lungs that stretch along the dorsal side of their bodies, supplemented by gastrointestinal gas produced during the digestion of plant fiber.

The West Indian manatee is divided into two distinct subspecies: the Florida manatee and the Antillean manatee. The Florida manatee lives in coastal waters, rivers, and springs throughout Florida and the southeastern United States, migrating towards warm-water sources such as power plant discharge basins during winter. The Antillean manatee inhabits coastal areas of the Caribbean, Central America, and northern South America. The African manatee occurs along the western coast of Africa, from Senegal to Angola, and also moves far inland along large river systems like the Niger and Congo. All manatee species face severe threats, including boat collisions, habitat destruction, and entanglement in fishing gear."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "look similar to dugongs, but with a differently shaped 1 ...............", "blank": True}, "correctAnswer": "tail"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "need to use their 2 ............... to help to turn their bodies around in order to look sideways", "blank": True}, "correctAnswer": "flippers"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "sense vibrations in the water by means of 3 ............... on their skin", "blank": True}, "correctAnswer": "hairs"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "eat mainly aquatic vegetation, such as 4 ...............", "blank": True}, "correctAnswer": "seagrasses", "acceptableAnswers": ["seagrasses", "seagrass"]},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "grasp and pull up plants with their 5 ...............", "blank": True}, "correctAnswer": "lips"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "regulate their 6 ............... using dense bones and large lungs", "blank": True}, "correctAnswer": "buoyancy"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "West Indian manatees can be found in a variety of different aquatic habitats.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "The Florida manatee lives in warmer waters than the Antillean manatee.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "The African manatee's range is limited to coastal waters between the West African countries of Mauritania and Angola.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "The extent of the Amazonian manatee's migrations depends on the season.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "Accidents involving motorboats are the main cause of death for Florida manatees.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Hunting manatees has been made illegal across all of their natural ranges.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Attempts to protect manatee habitats have met with success in certain regions.", "options": tfng_opts}, "correctAnswer": "TRUE"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Procrastination
A psychologist explains why we put off important tasks and how we can break the habit

A Procrastination is a near-universal human experience. At some point or another, everyone has delayed completing an urgent assignment, filing a tax return, or booking a medical check-up, opting instead for trivial diversions. While popular culture often dismisses procrastination as simple laziness or poor time management, psychological research reveals a much more complex phenomenon.

B Brain scans show that procrastination is essentially an emotional struggle rather than an intellectual failing. When faced with a task that triggers feelings of boredom, anxiety, self-doubt, or resentment, our brain perceives it as a threat. The amygdala—the brain's emotional threat center—reacts by initiating an avoidance response, prompting us to seek immediate relief in tasks that deliver quick dopamine surges, such as scrolling through social media or tidying a desk.

C This emotional avoidance mechanism is particularly prevalent among perfectionists. People with perfectionist tendencies frequently fear that their performance will fall short of their impossibly high standards. Consequently, delaying the task shields their self-worth from the possibility of failure: if a project is completed at the last minute and turns out poorly, they can blame lack of time rather than lack of ability.

D Studies indicate that procrastination imposes severe personal and economic penalties. Chronic procrastinators experience elevated levels of stress, insomnia, and weakened immune responses. In the workplace, employees who consistently procrastinate earn lower salaries on average and have significantly shorter tenures at their companies, as employers grow impatient with missed deadlines and unpredictable output.

E The emotional relief offered by procrastination is always temporary. Afterwards, people are inevitably left with feelings of guilt, shame, and panic, which further damages their mood and increases stress, triggering an even stronger compulsion to procrastinate on subsequent tasks.

F Overcoming procrastination requires addressing the underlying emotional roots. Psychologists recommend practicing self-compassion rather than self-criticism; acknowledging our shared human tendency to delay difficult tasks reduces the guilt that fuels further avoidance. Additionally, breaking tasks down into tiny, non-threatening micro-actions and removing environmental distractions can help bypass the brain's initial threat response."""

    para_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEF"]
    comp_opts = [
        {"label": "A", "text": "Their salaries are lower."},
        {"label": "B", "text": "The quality of their work is inferior."},
        {"label": "C", "text": "They don't keep their jobs for as long."},
        {"label": "D", "text": "They don't enjoy their working lives as much."},
        {"label": "E", "text": "They have poorer relationships with colleagues."},
    ]
    recom_opts = [
        {"label": "A", "text": "not judging ourselves harshly"},
        {"label": "B", "text": "setting ourselves manageable aims"},
        {"label": "C", "text": "rewarding ourselves for tasks achieved"},
        {"label": "D", "text": "prioritising tasks according to their importance"},
        {"label": "E", "text": "avoiding things that stop us concentrating on our tasks"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "mention of false assumptions about why people procrastinate", "options": para_opts}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "reference to the realisation that others also procrastinate", "options": para_opts}, "correctAnswer": "F"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "neurological evidence of a link between procrastination and emotion", "options": para_opts}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "GAP_FILL", "content": {"stem": "Many people think that procrastination is the result of 17 ...............", "blank": True}, "correctAnswer": "laziness"},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "tasks that cause us to feel 18 ...............", "blank": True}, "correctAnswer": "anxious"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "the brain perceives them as 19 ...............", "blank": True}, "correctAnswer": "threats"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "such as preparation for 20 ...............", "blank": True}, "correctAnswer": "exams"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "especially common among 21 ...............", "blank": True}, "correctAnswer": "perfectionists"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "followed by a feeling of 22 ...............", "blank": True}, "correctAnswer": "guilt"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO comparisons between employees who often procrastinate and those who do not are mentioned in the text? (Option 1)", "options": comp_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO comparisons between employees who often procrastinate and those who do not are mentioned in the text? (Option 2)", "options": comp_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO recommendations for getting out of a cycle of procrastination does the writer give? (Option 1)", "options": recom_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO recommendations for getting out of a cycle of procrastination does the writer give? (Option 2)", "options": recom_opts}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

Invasion of the Robot Umpires
A few years ago, Fred DeJesus from Brooklyn, New York became one of the first umpires in minor league baseball to call balls and strikes using an automated ball-strike system (ABS)—popularly known as the 'robot umpire'.

The system uses high-resolution tracking cameras mounted around the stadium to track the trajectory of every pitched baseball. An algorithm reconstructs the trajectory in three dimensions and compares it against a standardized virtual strike zone, custom-tailored to the height of each individual batter. The system calculates whether the ball touched any portion of the strike zone and transmits the decision to an earpiece worn by the human umpire standing behind the catcher, who then makes the physical signal and vocal announcement.

Historically, baseball has celebrated the human element of officiating. Umpires brought personal interpretations and idiosyncrasies to the game, and legendary arguments between fiery managers and umpires over disputed strike calls formed part of baseball folklore. However, advancing television broadcasting technology—such as the on-screen digital strike box introduced in the late 1990s—exposed human fallibility to millions of viewers at home. Studies showed that human umpires missed upwards of 10% of strike zone calls, sparking intense public debate and pressure for automated assistance.

Major League Baseball (MLB) began testing ABS in minor and independent leagues with a dual objective: eliminate egregious officiating errors while speeding up the pace of play. Yet the reception among players and fans has been mixed. Some pitchers complain that the robot's three-dimensional zone rewards pitches that only graze the back tip of the strike zone—pitches that no human umpire would ever call a strike. Furthermore, during games where ABS was first tested, managers and spectators noted that strike calls were met with eerie, total silence from the dugout, draining some of the passionate tension that makes baseball captivating.

Philosophers Alva Noë and Michael Russo caution against the pursuit of sterile perfection in sports. They argue that accuracy should not be conflated with genuine athletic drama and human engagement. Baseball, they contend, is a ritual designed to cultivate community and savor suspense, not an exercise in algorithmic optimization."""

    ynng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]
    abs_phrase_opts = [
        {"label": "A", "text": "pitch boundary"},
        {"label": "B", "text": "numerous disputes"},
        {"label": "C", "text": "team tactics"},
        {"label": "D", "text": "subjective assessment"},
        {"label": "E", "text": "widespread approval"},
        {"label": "F", "text": "former roles"},
        {"label": "G", "text": "total silence"},
        {"label": "H", "text": "perceived area"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "TRUE_FALSE_NG", "content": {"stem": "When DeJesus first used ABS, he shared decision-making about strikes with it.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 28, "order": 27, "type": "TRUE_FALSE_NG", "content": {"stem": "MLB considered it necessary to amend the size of the strike zone after introducing ABS.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 29, "order": 28, "type": "TRUE_FALSE_NG", "content": {"stem": "Batters were quicker to adapt to ABS than pitchers were.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 30, "order": 29, "type": "TRUE_FALSE_NG", "content": {"stem": "Television broadcasts initially led viewers to question the precision of digital strike boxes.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 31, "order": 30, "type": "TRUE_FALSE_NG", "content": {"stem": "Managers were generally in favour of replacing human umpires with automated systems.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "The human umpire is still required to confirm the decision transmitted to the earpiece.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "Even after ABS was developed, MLB still wanted human umpires to shout out decisions as they had in their 33 ...............", "options": abs_phrase_opts}, "correctAnswer": "F"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "The umpire's job had, at one time, required a 34 ............... about whether a ball was a strike.", "options": abs_phrase_opts}, "correctAnswer": "D"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "crosses through a 35 ............... extending approximately from the batter's knee to his chest.", "options": abs_phrase_opts}, "correctAnswer": "H"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "In the past, 36 ............... over strike calls were not uncommon", "options": abs_phrase_opts}, "correctAnswer": "B"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "during the first game DeJesus used ABS, strike calls were met with 37 ...............", "options": abs_phrase_opts}, "correctAnswer": "G"},
        {"number": 38, "order": 37, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer suggest about ABS in the fifth paragraph?", "options": [{"label": "A", "text": "It is bound to make key decisions that are wrong."}, {"label": "B", "text": "It may reduce some of the appeal of the game."}, {"label": "C", "text": "It will lead to the disappearance of human umpires."}, {"label": "D", "text": "It may increase calls for the rules of baseball to be changed."}]}, "correctAnswer": "B"},
        {"number": 39, "order": 38, "type": "MULTIPLE_CHOICE", "content": {"stem": "Morgan Sword says that the introduction of ABS", "options": [{"label": "A", "text": "was regarded as an experiment without a guaranteed outcome."}, {"label": "B", "text": "was intended to keep up with developments in other sports."}, {"label": "C", "text": "was a response to changing attitudes about the role of sport."}, {"label": "D", "text": "was an attempt to ensure baseball retained a young audience."}]}, "correctAnswer": "D"},
        {"number": 40, "order": 39, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why does the writer include the views of Noë and Russo?", "options": [{"label": "A", "text": "to show that attitudes to technology vary widely"}, {"label": "B", "text": "to argue that people have unrealistic expectations of sport"}, {"label": "C", "text": "to indicate that accuracy is not the same thing as enjoyment"}, {"label": "D", "text": "to suggest that the number of baseball fans needs to increase."}]}, "correctAnswer": "C"},
    ]

    reading_draft = {
        "title": "Test 24.C20.02 - Reading",
        "slug": "test-24-reading",
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
