# Test 35: Cambridge 16 Test 1 (Test 35.C16.01)
import json
import os

def get_test_35():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Children's Engineering Workshops
Tiny Engineers (ages 4–5)
Activities
• Create a cover for an 1 ............... so they can drop it from a height without breaking it.
• Take part in a competition to build the tallest 2 ............... .
• Make a 3 ............... powered by a balloon.

Junior Engineers (ages 6–8)
Activities:
• Build model cars, trucks and 4 ............... and learn how to program them so they can move.
• Take part in a competition to build the longest 5 ............... using card and wood.
• Create a short 6 ............... with special software.
• Build, 7 ............... and program a humanoid robot.

Cost for a five-week block: £50
Held on 8 ............... from 10 am to 11 am

Location
Building 10A, 9 ............... Industrial Estate, Grasford
Plenty of 10 ............... is available."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Create a cover for an 1 ________ so they can drop it from a height without breaking it.", "blank": True}, "correctAnswer": "egg"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Take part in a competition to build the tallest 2 ________ .", "blank": True}, "correctAnswer": "tower"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Make a 3 ________ powered by a balloon.", "blank": True}, "correctAnswer": "car"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Build model cars, trucks and 4 ________ and learn how to program them so they can move.", "blank": True}, "correctAnswer": "animals"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Take part in a competition to build the longest 5 ________ using card and wood.", "blank": True}, "correctAnswer": "bridge"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Create a short 6 ________ with special software.", "blank": True}, "correctAnswer": "movie", "acceptableAnswers": ["movie", "film"]},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Build, 7 ________ and program a humanoid robot.", "blank": True}, "correctAnswer": "decorate"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Held on 8 ________ from 10 am to 11 am", "blank": True}, "correctAnswer": "Wednesdays", "acceptableAnswers": ["Wednesdays", "Wednesday"]},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Building 10A, 9 ________ Industrial Estate, Grasford", "blank": True}, "correctAnswer": "Fradstone"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Plenty of 10 ________ is available.", "blank": True}, "correctAnswer": "parking"},
    ]

    s2_content = """Questions 11–14
Choose the correct letter, A, B or C.

11 Stevenson's was founded in
A 1923.
B 1924.
C 1926.

12 Originally, Stevenson's manufactured goods for
A the healthcare industry.
B the automotive industry.
C the machine tools industry.

13 What does the speaker say about the company premises?
A The company has recently moved.
B The company has no plans to move.
C The company is going to move shortly.

14 The programme for the work experience group includes
A time to do research.
B meetings with a teacher.
C talks by staff.

Questions 15–20
Label the map below.
Write the correct letter, A–J, next to Questions 15–20.

Plan of Stevenson's site

![Plan of Stevenson's site](/uploads/images/test-35-map.png)

15 coffee room
16 warehouse
17 staff canteen
18 meeting room
19 human resources
20 boardroom"""

    stevenson_map_opts = [
        {"label": "A", "text": "Location A"},
        {"label": "B", "text": "Location B"},
        {"label": "C", "text": "Location C"},
        {"label": "D", "text": "Location D"},
        {"label": "E", "text": "Location E"},
        {"label": "F", "text": "Location F"},
        {"label": "G", "text": "Location G"},
        {"label": "H", "text": "Location H"},
        {"label": "I", "text": "Location I"},
        {"label": "J", "text": "Location J"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Stevenson's was founded in", "options": [{"label": "A", "text": "1923."}, {"label": "B", "text": "1924."}, {"label": "C", "text": "1926."}]}, "correctAnswer": "C"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Originally, Stevenson's manufactured goods for", "options": [{"label": "A", "text": "the healthcare industry."}, {"label": "B", "text": "the automotive industry."}, {"label": "C", "text": "the machine tools industry."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the speaker say about the company premises?", "options": [{"label": "A", "text": "The company has recently moved."}, {"label": "B", "text": "The company has no plans to move."}, {"label": "C", "text": "The company is going to move shortly."}]}, "correctAnswer": "B"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "The programme for the work experience group includes", "options": [{"label": "A", "text": "time to do research."}, {"label": "B", "text": "meetings with a teacher."}, {"label": "C", "text": "talks by staff."}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "coffee room", "options": stevenson_map_opts}, "correctAnswer": "H"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "warehouse", "options": stevenson_map_opts}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "staff canteen", "options": stevenson_map_opts}, "correctAnswer": "G"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "meeting room", "options": stevenson_map_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "human resources", "options": stevenson_map_opts}, "correctAnswer": "I"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "boardroom", "options": stevenson_map_opts}, "correctAnswer": "A"},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful?
A the Bird Park visit
B the workshop sessions
C the Natural History Museum visit
D the projects done in previous years
E the handouts with research sources

Questions 23 and 24
Choose TWO letters, A–E.
In which TWO ways do both Jess and Tom decide to change their proposals?
A by giving a rationale for their action plans
B by being less specific about the outcome
C by adding a video diary presentation
D by providing a timeline and a mind map
E by making their notes more evaluative

Questions 25–30
Which personal meaning do the students decide to give to each of the following pictures?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 25–30.

Personal meanings
A a childhood memory
B hope for the future
C fast movement
D a potential threat
E the power of colour
F the continuity of life
G protection of nature
H a confused attitude to nature

Pictures
25 Falcon (Landseer)
26 Fish hawk (Audubon)
27 Kingfisher (van Gogh)
28 Portrait of William Wells
29 Vairumati (Gauguin)
30 Portrait of Giovanni de Medici"""

    intro_stage_opts = [
        {"label": "A", "text": "the Bird Park visit"},
        {"label": "B", "text": "the workshop sessions"},
        {"label": "C", "text": "the Natural History Museum visit"},
        {"label": "D", "text": "the projects done in previous years"},
        {"label": "E", "text": "the handouts with research sources"},
    ]

    change_proposals_opts = [
        {"label": "A", "text": "by giving a rationale for their action plans"},
        {"label": "B", "text": "by being less specific about the outcome"},
        {"label": "C", "text": "by adding a video diary presentation"},
        {"label": "D", "text": "by providing a timeline and a mind map"},
        {"label": "E", "text": "by making their notes more evaluative"},
    ]

    pictures_opts = [
        {"label": "A", "text": "a childhood memory"},
        {"label": "B", "text": "hope for the future"},
        {"label": "C", "text": "fast movement"},
        {"label": "D", "text": "a potential threat"},
        {"label": "E", "text": "the power of colour"},
        {"label": "F", "text": "the continuity of life"},
        {"label": "G", "text": "protection of nature"},
        {"label": "H", "text": "a confused attitude to nature"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful? (Option 1)", "options": intro_stage_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful? (Option 2)", "options": intro_stage_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "In which TWO ways do both Jess and Tom decide to change their proposals? (Option 1)", "options": change_proposals_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "In which TWO ways do both Jess and Tom decide to change their proposals? (Option 2)", "options": change_proposals_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Falcon (Landseer)", "options": pictures_opts}, "correctAnswer": "D"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Fish hawk (Audubon)", "options": pictures_opts}, "correctAnswer": "C"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Kingfisher (van Gogh)", "options": pictures_opts}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Portrait of William Wells", "options": pictures_opts}, "correctAnswer": "H"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Vairumati (Gauguin)", "options": pictures_opts}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Portrait of Giovanni de Medici", "options": pictures_opts}, "correctAnswer": "G"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Stoicism
Stoicism is still relevant today because of its 31 ............... appeal.

Ancient Stoics
• Stoicism was founded over 2,000 years ago in Greece.
• The Stoics' ideas are surprisingly well known, despite not being intended for 32 ............... .

Stoic principles
• Happiness could be achieved by leading a virtuous life.
• Controlling emotions was essential.
• Epictetus said that external events cannot be controlled but the 33 ............... people make in response can be controlled.
• A Stoic is someone who has a different view on experiences which others would consider as 34 ............... .

The influence of Stoicism
• George Washington organised a 35 ............... about Cato to motivate his men.
• The French artist Delacroix was a Stoic.
• Adam Smith's ideas on 36 ............... were influenced by Stoicism.
• Some of today's political leaders are inspired by the Stoics.
• Cognitive Behaviour Therapy (CBT)
  - the treatment for 37 ............... is based on ideas from Stoicism
  - people learn to base their thinking on 38 ............... .
• In business, people benefit from Stoicism by identifying obstacles as 39 ............... .

Relevance of Stoicism
• It requires a lot of 40 ............... but Stoicism can help people to lead a good life.
• It teaches people that having a strong character is more important than anything else."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "Stoicism is still relevant today because of its 31 ________ appeal.", "blank": True}, "correctAnswer": "practical"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "The Stoics' ideas are surprisingly well known, despite not being intended for 32 ________ .", "blank": True}, "correctAnswer": "publication"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Epictetus said that external events cannot be controlled but the 33 ________ people make in response can be controlled.", "blank": True}, "correctAnswer": "choices"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "A Stoic is someone who has a different view on experiences which others would consider as 34 ________ .", "blank": True}, "correctAnswer": "negative"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "George Washington organised a 35 ________ about Cato to motivate his men.", "blank": True}, "correctAnswer": "play"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Adam Smith's ideas on 36 ________ were influenced by Stoicism.", "blank": True}, "correctAnswer": "capitalism"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "the treatment for 37 ________ is based on ideas from Stoicism", "blank": True}, "correctAnswer": "depression"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "people learn to base their thinking on 38 ________ .", "blank": True}, "correctAnswer": "logic"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "In business, people benefit from Stoicism by identifying obstacles as 39 ________ .", "blank": True}, "correctAnswer": "opportunity"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "It requires a lot of 40 ________ but Stoicism can help people to lead a good life.", "blank": True}, "correctAnswer": "practice", "acceptableAnswers": ["practice", "practise"]},
    ]

    t35_listening = {
        "title": "Test 35.C16.01 - Listening",
        "slug": "test-35-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-35-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-35-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-35-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-35-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_text = """Why we need to protect polar bears

Polar bears are facing severe threats from climate change, and their disappearance could have far-reaching consequences. They are uniquely adapted to the harsh conditions of the Arctic Circle, where temperatures often fall to -40°C. One reason is that they have up to 11 centimetres of adipose tissue underneath their skin. In humans, similar levels of fat would lead to obesity and increased risk of diabetes and heart disease, yet polar bears suffer no such health problems.

A 2014 study by Shi Ping Liu and colleagues compared the genetic profile of polar bears with that of their closest relatives, brown bears from warmer regions. This helped determine the genes enabling polar bears to survive in one of the world's most extreme environments. Liu's team identified that polar bears possess a gene known as APoB, which lowers levels of low-density lipoproteins (LDLs), a form of 'bad' cholesterol. In humans, mutations of this gene increase heart disease risk, making polar bears a promising model for understanding human cardiovascular health.

The polar bear genome may also hold clues for treating osteoporosis, a disease characterized by reduced bone density due to lack of exercise, poor calcium intake, or food starvation. Bone tissue normally undergoes remodeling based on nutrient levels and mechanical stress. Female polar bears face extreme conditions during pregnancy. In autumn, they dig maternity dens in snow and remain there through winter, fasting for about six months while nursing their cubs. Despite depleting calcium reserves, their bones remain dense and strong.

In 2008, physiologists Alanda Lennox and Allen Goodship discovered that pregnant bears increase bone density prior to entering dens, and emerged six months later without significant loss of bone density. Brown bears lack this capacity and must rebuild bone in spring. Understanding this mechanism could benefit bedridden patients and astronauts.

Beyond medical benefits, conservation should consider polar bears' intelligence and emotional life. Contrary to common perceptions of bears as unintelligent and violent, anecdotal and scientific evidence shows strong problem-solving abilities. At Tennoji Zoo in Osaka, a male bear named GoGo used a tree branch as a tool to dislodge meat placed out of reach. Wild bears have also exhibited calculating behavior, such as jumping onto barrels to reach a platform where a photographer stood four metres high.

A 2008 study by Alison Ames showed bears engaging in conscious manipulation of objects, stacking them and knocking them down like a game. Furthermore, bears display emotions: they strike at ice and snow out of frustration when missing a kill. They can also form interspecies relationships, playing with sled dogs or, in the case of a bear named Agee, swimming with her human trainer Mark Dumas."""

    p1_q_content = """Questions 1–7
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–7 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 Polar bears suffer from various health problems due to the build-up of fat under their skin.
2 The study done by Liu and his colleagues compared different groups of polar bears.
3 Liu and colleagues were the first researchers to compare polar bears and brown bears genetically.
4 Polar bears are able to control their levels of 'bad' cholesterol by genetic means.
5 Female polar bears are able to survive for about six months without food.
6 It was found that the bones of female polar bears were very weak when they came out of their dens in spring.
7 The polar bear's mechanism for increasing bone density could also be used by people one day.

Questions 8–13
Complete the table below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 8–13 on your answer sheet.

Reasons why polar bears should be protected
People think of bears as unintelligent and 8 ............... .
However, this may not be correct. For example:
• In Tennoji Zoo, a bear has been seen using a branch as a 9 ............... . This allowed him to knock down some 10 ............... .
• A wild polar bear worked out a method of reaching a platform where a 11 ............... was located.
• Polar bears have displayed behaviour such as conscious manipulation of objects and activity similar to a 12 ............... .
Bears may also display emotions. For example:
• They may make movements suggesting 13 ............... if disappointed when hunting.
• They may form relationships with other species."""

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "Polar bears suffer from various health problems due to the build-up of fat under their skin.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "The study done by Liu and his colleagues compared different groups of polar bears.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "Liu and colleagues were the first researchers to compare polar bears and brown bears genetically.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Polar bears are able to control their levels of 'bad' cholesterol by genetic means.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "Female polar bears are able to survive for about six months without food.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "It was found that the bones of female polar bears were very weak when they came out of their dens in spring.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 7, "order": 6, "type": "TRUE_FALSE_NG", "content": {"stem": "The polar bear's mechanism for increasing bone density could also be used by people one day.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "People think of bears as unintelligent and 8 ________ .", "blank": True}, "correctAnswer": "violent"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "In Tennoji Zoo, a bear has been seen using a branch as a 9 ________ .", "blank": True}, "correctAnswer": "tool"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "This allowed him to knock down some 10 ________ .", "blank": True}, "correctAnswer": "meat"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "reaching a platform where a 11 ________ was located.", "blank": True}, "correctAnswer": "photographer"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "activity similar to a 12 ________ .", "blank": True}, "correctAnswer": "game"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "They may make movements suggesting 13 ________ if disappointed when hunting.", "blank": True}, "correctAnswer": "frustration"},
    ]

    p2_text = """The Step Pyramid of Djoser

A The pyramids are ancient Egypt's most famous monuments and continue to fascinate visitors today. Although other civilizations also built pyramids, Egypt's monumental tradition began with a tomb for one ruler, conceived by a brilliant architect: the Step Pyramid of Djoser at Saqqara.

B Djoser was the first ruler of Egypt's Third Dynasty and pioneered stone construction. Earlier tombs were rectangular structures of sun-dried mudbrick covering subterranean burial chambers. Djoser's chief official, Imhotep, conceived an ambitious design: stacking progressively smaller stone slabs to form a stepped pyramid. Djoser ruled for an estimated 19 years, though some scholars argue his reign lasted longer given the scale of construction.

C Modern excavations show the Step Pyramid was constructed through several distinct phases. Historian Marc Van de Mieroop observes that extensive experimentation occurred before completing the six-tiered structure. The enormous mass posed structural challenges, prompting builders to angle the stones inward to prevent collapse.

D When finished, the 62-metre monument was the tallest building of its era. The surrounding 16-hectare complex functioned like a miniature city, featuring a temple, courtyards, shrines, and living quarters for priests. It was encircled by a 10.5-metre-high wall with a 750-metre trench and 13 false doorways, leaving only one concealed true entrance at the south-east corner to deter intruders. In recognition of Imhotep's groundbreaking design, Djoser had the architect's name inscribed alongside his own.

E Beneath the pyramid lay a subterranean maze of corridors designed to baffle grave robbers. Excavations uncovered more than 40,000 stone vessels bearing names of First and Second Dynasty pharaohs. Scholars debate whether these vessels were buried by Djoser to honor previous dynasties or deposited in shafts to block access to the royal burial chamber.

F Despite these precautions, thieves breached the tomb in antiquity, looting Djoser's treasures and mummy. Nevertheless, the remaining architecture and artifacts left archaeologists in awe of the ancient builders' skill.

G As Egyptologist Miroslav Verner observes, the Step Pyramid complex represents a defining milestone in monumental architecture, establishing the archetype that guided all subsequent Egyptian pyramid builders."""

    p2_q_content = """Questions 14–20
Reading Passage 2 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.
Write the correct number, i–ix, in boxes 14–20 on your answer sheet.

List of Headings
i The areas and artefacts within the pyramid itself
ii A difficult task for those involved
iii A king who saved his people
iv A single certainty among other less definite facts
v An overview of the external buildings and areas
vi A pyramid design that others copied
vii An idea for changing the design of burial structures
viii An incredible experience despite the few remains
ix The answers to some unexpected questions

14 Paragraph A
15 Paragraph B
16 Paragraph C
17 Paragraph D
18 Paragraph E
19 Paragraph F
20 Paragraph G

Questions 21–24
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 21–24 on your answer sheet.

The Step Pyramid of Djoser
The complex that includes the Step Pyramid and its surroundings is considered to be as big as an Egyptian 21 ............... of the past. The area outside the pyramid included accommodation that was occupied by 22 ............... , along with many other buildings and features.
A wall ran around the outside of the complex and a number of false entrances were built into this. In addition, a long 23 ............... encircled the wall. As a result, any visitors who had not been invited were cleverly prevented from entering the pyramid grounds unless they knew the 24 ............... of the real entrance.

Questions 25 and 26
Choose TWO letters, A–E.
Write the correct letters in boxes 25 and 26 on your answer sheet.
Which TWO of the following points does the writer make about King Djoser?
A Initially he had to be persuaded to build in stone rather than clay.
B There is disagreement concerning the length of his reign.
C He failed to appreciate Imhotep's part in the design of the Step Pyramid.
D A few of his possessions were still in his tomb when archaeologists found it.
E He criticised the design and construction of other pyramids in Egypt."""

    djoser_headings_opts = [
        {"label": "i", "text": "The areas and artefacts within the pyramid itself"},
        {"label": "ii", "text": "A difficult task for those involved"},
        {"label": "iii", "text": "A king who saved his people"},
        {"label": "iv", "text": "A single certainty among other less definite facts"},
        {"label": "v", "text": "An overview of the external buildings and areas"},
        {"label": "vi", "text": "A pyramid design that others copied"},
        {"label": "vii", "text": "An idea for changing the design of burial structures"},
        {"label": "viii", "text": "An incredible experience despite the few remains"},
        {"label": "ix", "text": "The answers to some unexpected questions"},
    ]

    djoser_points_opts = [
        {"label": "A", "text": "Initially he had to be persuaded to build in stone rather than clay."},
        {"label": "B", "text": "There is disagreement concerning the length of his reign."},
        {"label": "C", "text": "He failed to appreciate Imhotep's part in the design of the Step Pyramid."},
        {"label": "D", "text": "A few of his possessions were still in his tomb when archaeologists found it."},
        {"label": "E", "text": "He criticised the design and construction of other pyramids in Egypt."},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Paragraph A", "options": djoser_headings_opts}, "correctAnswer": "iv"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Paragraph B", "options": djoser_headings_opts}, "correctAnswer": "vii"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Paragraph C", "options": djoser_headings_opts}, "correctAnswer": "ii"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Paragraph D", "options": djoser_headings_opts}, "correctAnswer": "v"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Paragraph E", "options": djoser_headings_opts}, "correctAnswer": "i"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Paragraph F", "options": djoser_headings_opts}, "correctAnswer": "viii"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Paragraph G", "options": djoser_headings_opts}, "correctAnswer": "vi"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "as big as an Egyptian 21 ________ of the past.", "blank": True}, "correctAnswer": "city"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "accommodation that was occupied by 22 ________ , along with many other buildings and features.", "blank": True}, "correctAnswer": "priests"},
        {"number": 23, "order": 22, "type": "GAP_FILL", "content": {"stem": "In addition, a long 23 ________ encircled the wall.", "blank": True}, "correctAnswer": "trench"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "unless they knew the 24 ________ of the real entrance.", "blank": True}, "correctAnswer": "location"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following points does the writer make about King Djoser? (Option 1)", "options": djoser_points_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following points does the writer make about King Djoser? (Option 2)", "options": djoser_points_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
    ]

    p3_text = """The future of work

Consultancy estimates suggest that 3–14% of the global workforce will need to transition into new careers over the next decade as artificial intelligence transforms industries. AI manifests both as physical machines ('embodied AI') and as computational algorithms ('disembodied AI').

Dr Stella Pachidi of Cambridge Judge Business School observes that major transformations are occurring through the 'algorithmication' of data-driven roles in the knowledge economy. Algorithms now perform tasks once reserved for human expertise, from contract analysis to medical diagnostics. Organizations adopt algorithms because they seek decisions grounded in what they view as 'perfect information', while cutting costs and boosting efficiency.

However, Pachidi warns that replacing routine tasks with AI disrupts professional development: when novices no longer observe seasoned experts directly, traditional learning through peripheral participation breaks down. In a two-year study of a telecommunications firm, Pachidi found sales representatives increasingly relying on algorithmic recommendations rather than exercising personal judgement and intuition, stifling creative exploration. In some instances, staff even entered misleading data to meet algorithmic performance targets.

Researchers are working to make algorithms more transparent and explainable to strengthen users' confidence and understanding. Meanwhile, economist Professor Hamish Low argues that future careers will follow flexible, multistage paths rather than a linear trajectory toward retirement. Low rejects the assumption that automation reduces total jobs, explaining that new technologies generally expand overall employment opportunities.

Legal scholar Dr Ewan McGaughey similarly argues that technological change does not inevitably produce a jobless society. He contends that unemployment stems from legal and economic constraints on capital rather than technology itself, urging policymakers to enact bold social protections, retraining programs, and fair labor laws to ensure that the ongoing technological revolution produces shared economic security."""

    p3_q_content = """Questions 27–30
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–30 on your answer sheet.

27 The first paragraph tells us about
A the kinds of jobs that will be most affected by the growth of AI.
B the extent to which AI will alter the nature of the work that people do.
C the proportion of the world's labour force who will have jobs in AI in the future.
D the difference between ways that embodied and disembodied AI will impact on workers.

28 According to the second paragraph, what is Stella Pachidi's view of the 'knowledge economy'?
A It is having an influence on the number of jobs available.
B It is changing people's attitudes towards their occupations.
C It is the main reason why the production sector is declining.
D It is a key factor driving current developments in the workplace.

29 What did Pachidi observe at the telecommunications company?
A staff disagreeing with the recommendations of AI
B staff feeling resentful about the intrusion of AI in their work
C staff making sure that AI produces the results that they want
D staff allowing AI to carry out tasks they ought to do themselves

30 In his recently published research, Ewan McGaughey
A challenges the idea that redundancy is a negative thing.
B shows the profound effect of mass unemployment on society.
C highlights some differences between past and future job losses.
D illustrates how changes in the job market can be successfully handled.

Questions 31–34
Complete the summary using the list of words, A–G, below.
Write the correct letter, A–G, in boxes 31–34 on your answer sheet.

The 'algorithmication' of jobs
Stella Pachidi of Cambridge Judge Business School has been focusing on the 'algorithmication' of jobs which rely not on production but on 31 ............... .
While monitoring a telecommunications company, Pachidi observed a growing 32 ............... on the recommendations made by AI, as workers begin to learn through the 'algorithm's eyes'. Meanwhile, staff are deterred from experimenting and using their own 33 ............... , and are therefore prevented from achieving innovation.
To avoid the kind of situations which Pachidi observed, researchers are trying to make AI's decision-making process easier to comprehend, and to increase users' 34 ............... with regard to the technology.

A pressure
B satisfaction
C intuition
D promotion
E reliance
F confidence
G information

Questions 35–40
Look at the following statements (Questions 35–40) and the list of people below.
Match each statement with the correct person, A, B or C.
Write the correct letter, A, B or C, in boxes 35–40 on your answer sheet.
NB You may use any letter more than once.

List of people
A Stella Pachidi
B Hamish Low
C Ewan McGaughey

35 Greater levels of automation will not result in lower employment.
36 There are several reasons why AI is appealing to businesses.
37 AI's potential to transform people's lives has parallels with major cultural shifts which occurred in previous eras.
38 It is important to be aware of the range of problems that AI causes.
39 People are going to follow a less conventional career path than in the past.
40 Authorities should take measures to ensure that there will be adequately paid work for everyone."""

    algo_words_opts = [
        {"label": "A", "text": "pressure"},
        {"label": "B", "text": "satisfaction"},
        {"label": "C", "text": "intuition"},
        {"label": "D", "text": "promotion"},
        {"label": "E", "text": "reliance"},
        {"label": "F", "text": "confidence"},
        {"label": "G", "text": "information"},
    ]

    pachidi_people_opts = [
        {"label": "A", "text": "Stella Pachidi"},
        {"label": "B", "text": "Hamish Low"},
        {"label": "C", "text": "Ewan McGaughey"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "The first paragraph tells us about", "options": [{"label": "A", "text": "the kinds of jobs that will be most affected by the growth of AI."}, {"label": "B", "text": "the extent to which AI will alter the nature of the work that people do."}, {"label": "C", "text": "the proportion of the world's labour force who will have jobs in AI in the future."}, {"label": "D", "text": "the difference between ways that embodied and disembodied AI will impact on workers."}]}, "correctAnswer": "B"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the second paragraph, what is Stella Pachidi's view of the 'knowledge economy'?", "options": [{"label": "A", "text": "It is having an influence on the number of jobs available."}, {"label": "B", "text": "It is changing people's attitudes towards their occupations."}, {"label": "C", "text": "It is the main reason why the production sector is declining."}, {"label": "D", "text": "It is a key factor driving current developments in the workplace."}]}, "correctAnswer": "D"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What did Pachidi observe at the telecommunications company?", "options": [{"label": "A", "text": "staff disagreeing with the recommendations of AI"}, {"label": "B", "text": "staff feeling resentful about the intrusion of AI in their work"}, {"label": "C", "text": "staff making sure that AI produces the results that they want"}, {"label": "D", "text": "staff allowing AI to carry out tasks they ought to do themselves"}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "In his recently published research, Ewan McGaughey", "options": [{"label": "A", "text": "challenges the idea that redundancy is a negative thing."}, {"label": "B", "text": "shows the profound effect of mass unemployment on society."}, {"label": "C", "text": "highlights some differences between past and future job losses."}, {"label": "D", "text": "illustrates how changes in the job market can be successfully handled."}]}, "correctAnswer": "D"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "jobs which rely not on production but on 31 ________ .", "options": algo_words_opts}, "correctAnswer": "G"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "Pachidi observed a growing 32 ________ on the recommendations made by AI,", "options": algo_words_opts}, "correctAnswer": "E"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "staff are deterred from experimenting and using their own 33 ________", "options": algo_words_opts}, "correctAnswer": "C"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "to increase users' 34 ________ with regard to the technology.", "options": algo_words_opts}, "correctAnswer": "F"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "Greater levels of automation will not result in lower employment.", "options": pachidi_people_opts}, "correctAnswer": "B"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "There are several reasons why AI is appealing to businesses.", "options": pachidi_people_opts}, "correctAnswer": "A"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "AI's potential to transform people's lives has parallels with major cultural shifts which occurred in previous eras.", "options": pachidi_people_opts}, "correctAnswer": "C"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "It is important to be aware of the range of problems that AI causes.", "options": pachidi_people_opts}, "correctAnswer": "A"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "People are going to follow a less conventional career path than in the past.", "options": pachidi_people_opts}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "Authorities should take measures to ensure that there will be adequately paid work for everyone.", "options": pachidi_people_opts}, "correctAnswer": "C"},
    ]

    t35_reading = {
        "title": "Test 35.C16.01 - Reading",
        "slug": "test-35-reading",
        "skill": "READING",
        "status": "DRAFT",
        "parts": [
            {"title": "Reading Passage 1", "content": f"{p1_text}\n\n{p1_q_content}", "questions": p1_questions},
            {"title": "Reading Passage 2", "content": f"{p2_text}\n\n{p2_q_content}", "questions": p2_questions},
            {"title": "Reading Passage 3", "content": f"{p3_text}\n\n{p3_q_content}", "questions": p3_questions},
        ]
    }

    return [t35_listening, t35_reading]
