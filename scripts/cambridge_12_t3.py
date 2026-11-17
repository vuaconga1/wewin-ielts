# Test 29: Cambridge 12 Test 3 (Test 29.C12.03)
import json
import os

def get_test_29():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD ONLY for each answer.

PUBLIC LIBRARY
Example
The library re-opened last month

The library now has
• a seating area with magazines
• an expanded section for books on 1 ...............
• a new section on local 2 ...............
• a community room for meetings (also possible to 3 ............... there)
• a new section of books for 4 ...............

For younger children
• the next Science Club meeting: experiments using things from your 5 ...............
• Reading Challenge: read six books during the holidays

For adults
• this Friday: a local author talks about a novel based on a real 6 ...............
• IT support is available on Tuesdays - no 7 ............... is necessary
• free check of blood 8 ............... and cholesterol levels (over 60s only)

Other information
• the library shop sells wall-charts, cards and 9 ...............
• evenings and weekends: free 10 ............... is available"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "an expanded section for books on ________", "blank": True}, "correctAnswer": "travel", "acceptableAnswers": ["travel", "travelling", "traveling"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "a new section on local ________", "blank": True}, "correctAnswer": "history"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "a community room for meetings (also possible to ________ there)", "blank": True}, "correctAnswer": "study"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "a new section of books for ________", "blank": True}, "correctAnswer": "teenagers"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "the next Science Club meeting: experiments using things from your ________", "blank": True}, "correctAnswer": "kitchen"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "this Friday: a local author talks about a novel based on a real ________", "blank": True}, "correctAnswer": "crime"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "IT support is available on Tuesdays - no ________ is necessary", "blank": True}, "correctAnswer": "appointment", "acceptableAnswers": ["appointment", "booking"]},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "free check of blood ________ and cholesterol levels (over 60s only)", "blank": True}, "correctAnswer": "sugar"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "the library shop sells wall-charts, cards and ________", "blank": True}, "correctAnswer": "stamps"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "evenings and weekends: free ________ is available", "blank": True}, "correctAnswer": "parking"},
    ]

    s2_content = """Questions 11 and 12
Choose TWO letters, A–E.
Which TWO age groups are taking increasing numbers of holidays with BC Travel?
A 16–30 years
B 31–42 years
C 43–54 years
D 55–64 years
E over 65 years

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO are the main reasons given for the popularity of activity holidays?
A Clients make new friends.
B Clients learn a useful skill.
C Clients learn about a different culture.
D Clients are excited by the risk involved.
E Clients find them good value for money.

Questions 15–17
Choose the correct letter, A, B or C.

15 How does BC Travel plan to expand the painting holidays?
A by adding to the number of locations
B by increasing the range of levels
C by employing more teachers

16 Why are BC Travel's cooking holidays unusual?
A They only use organic foods.
B They have an international focus.
C They mainly involve vegetarian dishes.

17 What does the speaker say about the photography holidays?
A Clients receive individual tuition.
B The tutors are also trained guides.
C Advice is given on selling photographs.

Questions 18–20
Complete the table below.
Write ONE WORD ONLY for each answer.

Fitness Holidays
Location | Main focus | Other comments
Ireland and Italy | general fitness | personally designed programme; also reduces 18 ...............
Greece | 19 ............... control | includes exercise on the beach
Morocco | mountain biking | wide variety of levels; one holiday that is specially designed for 20 ..............."""

    mc_opts_11_12 = [
        {"label": "A", "text": "16–30 years"},
        {"label": "B", "text": "31–42 years"},
        {"label": "C", "text": "43–54 years"},
        {"label": "D", "text": "55–64 years"},
        {"label": "E", "text": "over 65 years"},
    ]

    mc_opts_13_14 = [
        {"label": "A", "text": "Clients make new friends."},
        {"label": "B", "text": "Clients learn a useful skill."},
        {"label": "C", "text": "Clients learn about a different culture."},
        {"label": "D", "text": "Clients are excited by the risk involved."},
        {"label": "E", "text": "Clients find them good value for money."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO age groups are taking increasing numbers of holidays with BC Travel? (Question 1 of 2)", "options": mc_opts_11_12}, "correctAnswer": "D", "acceptableAnswers": ["D", "E"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO age groups are taking increasing numbers of holidays with BC Travel? (Question 2 of 2)", "options": mc_opts_11_12}, "correctAnswer": "E", "acceptableAnswers": ["D", "E"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO are the main reasons given for the popularity of activity holidays? (Question 1 of 2)", "options": mc_opts_13_14}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO are the main reasons given for the popularity of activity holidays? (Question 2 of 2)", "options": mc_opts_13_14}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does BC Travel plan to expand the painting holidays?", "options": [{"label": "A", "text": "by adding to the number of locations"}, {"label": "B", "text": "by increasing the range of levels"}, {"label": "C", "text": "by employing more teachers"}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why are BC Travel's cooking holidays unusual?", "options": [{"label": "A", "text": "They only use organic foods."}, {"label": "B", "text": "They have an international focus."}, {"label": "C", "text": "They mainly involve vegetarian dishes."}]}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the speaker say about the photography holidays?", "options": [{"label": "A", "text": "Clients receive individual tuition."}, {"label": "B", "text": "The tutors are also trained guides."}, {"label": "C", "text": "Advice is given on selling photographs."}]}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "Ireland and Italy - personally designed programme; also reduces ________", "blank": True}, "correctAnswer": "stress"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "Greece - ________ control; includes exercise on the beach", "blank": True}, "correctAnswer": "weight"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "Morocco - one holiday that is specially designed for ________", "blank": True}, "correctAnswer": "families"},
    ]

    s3_content = """Questions 21–26
Complete the flow-chart below.
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 21–26.

A patterns
B names
C sources
D questions
E employees
F solutions
G headings
H officials

STAGES IN DOING A TOURISM CASE STUDY
RESEARCH
Locate and read relevant articles, noting key information and also 21 ...............
Identify a problem or need
Select interviewees – these may be site 22 ..............., visitors or city 23 ...............
Prepare and carry out interviews. If possible, collect statistics.
Check whether 24 ............... of interviewees can be used

ANALYSIS
Select relevant information and try to identify 25 ...............
Decide on the best form of visuals

WRITING THE CASE STUDY
Give some background before writing the main sections
Do NOT end with 26 ...............

Questions 27–30
Choose the correct letter, A, B or C.

The Horton Castle site
27 Natalie and Dave agree one reason why so few people visit Horton Castle is that
A the publicity is poor.
B it is difficult to get to.
C there is little there of interest.

28 Natalie and Dave agree that the greatest problem with a visitor centre could be
A covering the investment costs.
B finding a big enough space for it.
C dealing with planning restrictions.

29 What does Dave say about conditions in the town of Horton?
A There is a lot of unemployment.
B There are few people of working age.
C There are opportunities for skilled workers.

30 According to Natalie, one way to prevent damage to the castle site would be to
A insist visitors have a guide.
B make visitors keep to the paths.
C limit visitor numbers."""

    flowchart_opts = [
        {"label": "A", "text": "patterns"},
        {"label": "B", "text": "names"},
        {"label": "C", "text": "sources"},
        {"label": "D", "text": "questions"},
        {"label": "E", "text": "employees"},
        {"label": "F", "text": "solutions"},
        {"label": "G", "text": "headings"},
        {"label": "H", "text": "officials"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "Locate and read relevant articles, noting key information and also 21", "options": flowchart_opts}, "correctAnswer": "C"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "Select interviewees – these may be site 22", "options": flowchart_opts}, "correctAnswer": "E"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "or city 23", "options": flowchart_opts}, "correctAnswer": "H"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "Check whether 24 of interviewees can be used", "options": flowchart_opts}, "correctAnswer": "B"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Select relevant information and try to identify 25", "options": flowchart_opts}, "correctAnswer": "A"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Do NOT end with 26", "options": flowchart_opts}, "correctAnswer": "F"},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "Natalie and Dave agree one reason why so few people visit Horton Castle is that", "options": [{"label": "A", "text": "the publicity is poor."}, {"label": "B", "text": "it is difficult to get to."}, {"label": "C", "text": "there is little there of interest."}]}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "Natalie and Dave agree that the greatest problem with a visitor centre could be", "options": [{"label": "A", "text": "covering the investment costs."}, {"label": "B", "text": "finding a big enough space for it."}, {"label": "C", "text": "dealing with planning restrictions."}]}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Dave say about conditions in the town of Horton?", "options": [{"label": "A", "text": "There is a lot of unemployment."}, {"label": "B", "text": "There are few people of working age."}, {"label": "C", "text": "There are opportunities for skilled workers."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Natalie, one way to prevent damage to the castle site would be to", "options": [{"label": "A", "text": "insist visitors have a guide."}, {"label": "B", "text": "make visitors keep to the paths."}, {"label": "C", "text": "limit visitor numbers."}]}, "correctAnswer": "B"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

The effects of environmental change on birds

Mercury (Hg)
• Highly toxic
• Released into the atmosphere from coal
• In water it may be consumed by fish
• It has also recently been found to affect birds which feed on 31 ...............

Research on effects of mercury on birds
• Claire Varian-Ramos is investigating:
  - the effects on birds' 32 ............... or mental processes, e.g. memory
  - the effects on bird song (usually learned from a bird's 33 ...............)
• Findings:
  - songs learned by birds exposed to mercury are less 34 ...............
  - this may have a negative effect on birds' 35 ...............
• Lab-based studies:
  - allow more 36 ............... for the experimenter

Implications for humans
• Migrating birds such as 37 ............... containing mercury may be eaten by humans
• Mercury also causes problems in learning 38 ...............
• Mercury in a mother's body from 39 ............... may affect the unborn child
• New regulations for mercury emissions will affect everyone's energy 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "It has also recently been found to affect birds which feed on ________", "blank": True}, "correctAnswer": "insects"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "the effects on birds' ________ or mental processes, e.g. memory", "blank": True}, "correctAnswer": "behaviour", "acceptableAnswers": ["behaviour", "behavior"]},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "the effects on bird song (usually learned from a bird's ________)", "blank": True}, "correctAnswer": "father"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "songs learned by birds exposed to mercury are less ________", "blank": True}, "correctAnswer": "complex", "acceptableAnswers": ["complex", "complicated"]},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "this may have a negative effect on birds' ________", "blank": True}, "correctAnswer": "reproduction", "acceptableAnswers": ["reproduction", "breeding"]},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "allow more ________ for the experimenter", "blank": True}, "correctAnswer": "control"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Migrating birds such as ________ containing mercury may be eaten by humans", "blank": True}, "correctAnswer": "duck", "acceptableAnswers": ["duck", "ducks"]},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Mercury also causes problems in learning ________", "blank": True}, "correctAnswer": "language"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Mercury in a mother's body from ________ may affect the unborn child", "blank": True}, "correctAnswer": "food"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "New regulations for mercury emissions will affect everyone's energy ________", "blank": True}, "correctAnswer": "cost", "acceptableAnswers": ["cost", "costs", "price", "prices", "bill", "bills"]},
    ]

    listening_draft = {
        "title": "Test 29.C12.03 - Listening",
        "slug": "test-29-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "parts": [
            {"title": "Section 1", "order": 0, "audioUrl": "/uploads/audio/test-29-section-1.mp3", "content": s1_content, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "audioUrl": "/uploads/audio/test-29-section-2.mp3", "content": s2_content, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "audioUrl": "/uploads/audio/test-29-section-3.mp3", "content": s3_content, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "audioUrl": "/uploads/audio/test-29-section-4.mp3", "content": s4_content, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

Flying tortoises
An airborne reintroduction programme has helped conservationists take significant steps to protect the endangered Galapagos tortoise.

A Forests of spiny cacti cover much of the uneven lava plains that separate the interior of the Galapagos island of Isabela from the Pacific Ocean. With its five distinct volcanoes, the island resembles a lunar landscape. Only the thick vegetation at the skirt of the often cloud-covered peak of Sierra Negra offers respite from the barren terrain below. This inhospitable environment is home to the giant Galapagos tortoise. Some time after the Galapagos's birth, around five million years ago, the islands were colonised by one or more tortoises from mainland South America. As these ancestral tortoises settled on the individual islands, the different populations adapted to their unique environments, giving rise to at least 14 different subspecies. Island life agreed with them. In the absence of significant predators, they grew to become the largest and longest-living tortoises on the planet, weighing more than 400 kilograms, occasionally exceeding 1.8 metres in length and living for more than a century.

B Before human arrival, the archipelago's tortoises numbered in the hundreds of thousands. From the 17th century onwards, pirates took a few on board for food, but the arrival of whaling ships in the 1790s saw this exploitation grow exponentially. Relatively immobile and capable of surviving for months without food or water, the tortoises were taken on board these ships to act as food supplies during long ocean passages. Sometimes, their bodies were processed into high-grade oil. In total, an estimated 200,000 animals were taken from the archipelago before the 20th century. This historical exploitation was then exacerbated when settlers came to the islands. They hunted the tortoises and destroyed their habitat to clear land for agriculture. They also introduced alien species – ranging from cattle, pigs, goats, rats and dogs to plants and ants – that either prey on the eggs and young tortoises or damage or destroy their habitat.

C Today, only 11 of the original subspecies survive and of these, several are highly endangered. In 1989, work began on a tortoise-breeding centre just outside the town of Puerto Villamil on Isabela, dedicated to protecting the island's tortoise populations. The centre's captive-breeding programme proved to be extremely successful, and it eventually had to deal with an overpopulation problem.

D The problem was also a pressing one. Captive-bred tortoises can't be reintroduced into the wild until they're at least five years old and weigh at least 4.5 kilograms, at which point their size and weight – and their hardened shells – are sufficient to protect them from predators. But if people wait too long after that point, the tortoises eventually become too large to transport.

E For years, repatriation efforts were carried out in small numbers, with the tortoises carried on the backs of men over weeks of long, treacherous hikes along narrow trails. But in November 2010, the environmentalist and Galapagos National Park liaison officer Godfrey Merlin, a visiting private motor yacht captain and a helicopter pilot gathered around a table in a small cafe in Puerto Ayora on the island of Santa Cruz to work out a more ambitious reintroduction. The aim was to use a helicopter to move 300 of the breeding centre's tortoises to various locations close to Sierra Negra.

F This unprecedented effort was made possible by the owners of the 67-metre yacht White Cloud, who provided the Galapagos National Park with free use of their helicopter and its experienced pilot, as well as the logistical support of the yacht, its captain and crew. Originally an air ambulance, the yacht's helicopter has a rear double door and a large internal space that's well suited for cargo, so a custom crate was designed to hold up to 33 tortoises with a total weight of about 150 kilograms. This weight, together with that of the fuel, pilot and four crew, approached the helicopter's maximum payload, and there were times when it was clearly right on the edge of the helicopter's capabilities. During a period of three days, a group of volunteers from the breeding centre worked around the clock to prepare the young tortoises for transport. Meanwhile, park wardens, dropped off ahead of time in remote locations, cleared landing sites within the thick brush, cacti and lava rocks.

G Upon their release, the juvenile tortoises quickly spread out over their ancestral territory, investigating their new surroundings and feeding on the vegetation. Eventually, one tiny tortoise came across a fully grown giant who had been lumbering around the island for around a hundred years. The two stood side by side, a powerful symbol of the regeneration of an ancient species.

Questions 1–7
Reading Passage 1 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.
Write the correct number, i–viii, in boxes 1–7 on your answer sheet.

List of Headings
i The importance of getting the timing right
ii Young meets old
iii Developments to the disadvantage of tortoise populations
iv Planning a bigger idea
v Tortoises populate the islands
vi Carrying out a carefully prepared operation
vii Looking for a home for the islands' tortoises
viii The start of the conservation project

1 Paragraph A
2 Paragraph B
3 Paragraph C
4 Paragraph D
5 Paragraph E
6 Paragraph F
7 Paragraph G

Questions 8–13
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 8–13 on your answer sheet.

The decline of the Galapagos tortoise
• Originally from mainland South America
• Numbers on Galapagos islands increased, due to lack of predators
• 17th century: small numbers taken onto ships used by 8 ...............
• 1790s: very large numbers taken onto whaling ships, kept for 9 ..............., and also used to produce 10 ...............
• Hunted by 11 ............... on the islands
• Habitat destruction: for the establishment of agriculture and by various 12 ............... not native to the islands, which also fed on baby tortoises and tortoises' 13 ..............."""

    headings_opts_p1 = [
        {"label": "i", "text": "The importance of getting the timing right"},
        {"label": "ii", "text": "Young meets old"},
        {"label": "iii", "text": "Developments to the disadvantage of tortoise populations"},
        {"label": "iv", "text": "Planning a bigger idea"},
        {"label": "v", "text": "Tortoises populate the islands"},
        {"label": "vi", "text": "Carrying out a carefully prepared operation"},
        {"label": "vii", "text": "Looking for a home for the islands' tortoises"},
        {"label": "viii", "text": "The start of the conservation project"},
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "MATCHING", "content": {"stem": "Paragraph A", "options": headings_opts_p1}, "correctAnswer": "v"},
        {"number": 2, "order": 1, "type": "MATCHING", "content": {"stem": "Paragraph B", "options": headings_opts_p1}, "correctAnswer": "iii"},
        {"number": 3, "order": 2, "type": "MATCHING", "content": {"stem": "Paragraph C", "options": headings_opts_p1}, "correctAnswer": "viii"},
        {"number": 4, "order": 3, "type": "MATCHING", "content": {"stem": "Paragraph D", "options": headings_opts_p1}, "correctAnswer": "i"},
        {"number": 5, "order": 4, "type": "MATCHING", "content": {"stem": "Paragraph E", "options": headings_opts_p1}, "correctAnswer": "iv"},
        {"number": 6, "order": 5, "type": "MATCHING", "content": {"stem": "Paragraph F", "options": headings_opts_p1}, "correctAnswer": "vi"},
        {"number": 7, "order": 6, "type": "MATCHING", "content": {"stem": "Paragraph G", "options": headings_opts_p1}, "correctAnswer": "ii"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "17th century: small numbers taken onto ships used by ________", "blank": True}, "correctAnswer": "pirates"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "1790s: very large numbers taken onto whaling ships, kept for ________,", "blank": True}, "correctAnswer": "food"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "and also used to produce ________", "blank": True}, "correctAnswer": "oil"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "Hunted by ________ on the islands", "blank": True}, "correctAnswer": "settlers"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "Habitat destruction: for the establishment of agriculture and by various ________ not native to the islands,", "blank": True}, "correctAnswer": "species"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "which also fed on baby tortoises and tortoises' ________", "blank": True}, "correctAnswer": "eggs"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

The Intersection of Health Sciences and Geography

A While many diseases that affect humans have been eradicated due to improvements in vaccinations and the availability of healthcare, there are still areas around the world where certain health issues are more prevalent. In a world that is far more globalised than ever before, people come into contact with one another through travel and living closer and closer to each other. As a result, super-viruses and other infections resistant to antibiotics are becoming more and more common.

B Geography can often play a very large role in the health concerns of certain populations. For instance, depending on where you live, you will not have the same health concerns as someone who lives in a different geographical region. Perhaps one of the most obvious examples of this idea is malaria-prone areas, which are usually tropical regions that foster a warm and damp environment in which the mosquitos that can give people this disease can grow. Malaria is much less of a problem in high-altitude deserts, for instance.

C In some countries, geographical factors influence the health and well-being of the population in very obvious ways. In many large cities, the wind is not strong enough to clear the air of the massive amounts of smog and pollution that cause asthma, lung problems, eyesight issues and more in the people who live there. Part of the problem is, of course, the massive number of cars being driven, in addition to factories that run on coal power. The rapid industrialisation of some countries in recent years has also led to the cutting down of forests to allow for the expansion of big cities, which makes it even harder to fight the pollution with the fresh air that is produced by plants.

D It is in situations like these that the field of health geography comes into its own. It is an increasingly important area of study in a world where diseases like polio are re-emerging, respiratory diseases continue to spread, and malaria-prone areas are still fighting to find a better cure. Health geography is the combination of, on the one hand, knowledge regarding geography and methods used to analyse and interpret geographical information, and on the other, the study of health, diseases and healthcare practices around the world. The aim of this hybrid science is to create solutions for common geography-based health problems. While people will always be prone to illness, the study of how geography affects our health could lead to the eradication of certain illnesses, and the prevention of others in the future. By understanding why and how we get sick, we can change the way we treat illness and disease specific to certain geographical locations.

E The geography of disease and ill health analyses the frequency with which certain diseases appear in different parts of the world, and overlays the data with the geography of the region, to see if there could be a correlation between the two. Health geographers also study factors that could make certain individuals or a population more likely to be taken ill with a specific health concern or disease, as compared with the population of another area. Health geographers in this field are usually trained as healthcare workers, and have an understanding of basic epidemiology as it relates to the spread of diseases among the population.

F Researchers study the interactions between humans and their environment that could lead to illness (such as asthma in places with high levels of pollution) and work to create a clear way of categorising illnesses, diseases and epidemics into local and global scales. Health geographers can map the spread of illnesses and attempt to identify the reasons behind an increase or decrease in illnesses, as they work to find a way to halt the further spread or re-emergence of diseases in vulnerable populations.

G The second subcategory of health geography is the geography of healthcare provision. This group studies the availability (or lack thereof) of healthcare resources to individuals and populations around the world. In both developed and developing nations there is often a very large discrepancy between the options available to people in different social classes, income brackets, and levels of education. Individuals working in the area of the geography of healthcare provision attempt to assess the levels of healthcare in the area (for instance, it may be very difficult for people to get medical attention because there is a mountain between their village and the nearest hospital). These researchers are on the frontline of making recommendations regarding policy to international organisations, local government bodies and others.

H The field of health geography is often overlooked, but it constitutes a huge area of need in the fields of geography and healthcare. If we can understand how geography affects our health no matter where in the world we are located, we can better treat disease, prevent illness, and keep people safe and well.

Questions 14–19
Reading Passage 2 has eight sections, A–H.
Which paragraph contains the following information?
Write the correct letter, A–H, in boxes 14–19 on your answer sheet.
NB You may use any letter more than once.

14 an acceptance that not all diseases can be totally eliminated
15 examples of physical conditions caused by human behaviour
16 a reference to classifying diseases on the basis of how far they extend geographically
17 reasons why the level of access to healthcare can vary within a country
18 a description of health geography as a mixture of different academic fields
19 a description of the type of area where a particular illness is rare

Questions 20–26
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 20–26 on your answer sheet.

20 Certain diseases have disappeared, thanks to better ............... and healthcare.
21 Because there is more contact between people, ............... are losing their usefulness.
22 Disease-causing ............... are most likely to be found in hot, damp regions.
23 One cause of pollution is ............... that burn a particular fuel.
24 The growth of cities often has an impact on nearby ............... .
25 ............... is one disease that is growing after having been eradicated.
26 A physical barrier such as a ............... can prevent people from reaching a hospital."""

    info_opts_p2 = [
        {"label": "A", "text": "Paragraph A"},
        {"label": "B", "text": "Paragraph B"},
        {"label": "C", "text": "Paragraph C"},
        {"label": "D", "text": "Paragraph D"},
        {"label": "E", "text": "Paragraph E"},
        {"label": "F", "text": "Paragraph F"},
        {"label": "G", "text": "Paragraph G"},
        {"label": "H", "text": "Paragraph H"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "an acceptance that not all diseases can be totally eliminated", "options": info_opts_p2}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "examples of physical conditions caused by human behaviour", "options": info_opts_p2}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "a reference to classifying diseases on the basis of how far they extend geographically", "options": info_opts_p2}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "reasons why the level of access to healthcare can vary within a country", "options": info_opts_p2}, "correctAnswer": "G"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "a description of health geography as a mixture of different academic fields", "options": info_opts_p2}, "correctAnswer": "D"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "a description of the type of area where a particular illness is rare", "options": info_opts_p2}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "Certain diseases have disappeared, thanks to better ________ and healthcare.", "blank": True}, "correctAnswer": "vaccinations"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "Because there is more contact between people, ________ are losing their usefulness.", "blank": True}, "correctAnswer": "antibiotics"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "Disease-causing ________ are most likely to be found in hot, damp regions.", "blank": True}, "correctAnswer": "mosquitoes", "acceptableAnswers": ["mosquitoes", "mosquitos", "mosquito"]},
        {"number": 23, "order": 22, "type": "GAP_FILL", "content": {"stem": "One cause of pollution is ________ that burn a particular fuel.", "blank": True}, "correctAnswer": "factories"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "The growth of cities often has an impact on nearby ________ .", "blank": True}, "correctAnswer": "forests"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "________ is one disease that is growing after having been eradicated.", "blank": True}, "correctAnswer": "Polio", "acceptableAnswers": ["Polio", "polio"]},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "A physical barrier such as a ________ can prevent people from reaching a hospital.", "blank": True}, "correctAnswer": "mountain"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

Music and the emotions
Neuroscientist Jonah Lehrer considers the emotional power of music

Why does music make us feel? On the one hand, music is a purely abstract art form, devoid of language or explicit ideas. And yet, even though music says little, it still manages to touch us deeply. When listening to our favourite songs, our body betrays all the symptoms of emotional arousal. The pupils in our eyes dilate, our pulse and blood pressure rise, the electrical conductance of our skin is lowered, and the cerebellum, a brain region associated with bodily movement, becomes strangely active. Blood is even re-directed to the muscles in our legs. In other words, sound stirs us at our biological roots.

A recent paper in Nature Neuroscience by a research team in Montreal, Canada, marks an important step in revealing the precise underpinnings of 'the potent pleasurable stimulus' that is music. Although the study involves plenty of fancy technology, including functional magnetic resonance imaging (fMRI) and ligand-based positron emission tomography (PET) scanning, the experiment itself was rather straightforward. After screening 217 individuals who responded to advertisements requesting people who experience 'chills' to instrumental music, the scientists narrowed down the subject pool to ten. They then asked the subjects to bring in their playlist of favourite songs – virtually every genre was represented, from techno to tango – and played them the music while their brain activity was monitored. Because the scientists were combining methodologies (PET and fMRI), they were able to obtain an impressively exact and detailed portrait of music in the brain. The first thing they discovered is that music triggers the production of dopamine – a chemical with a key role in setting people's moods – by the neurons (nerve cells) in both the dorsal and ventral regions of the brain. As these two regions have long been linked with the experience of pleasure, this finding isn't particularly surprising.

What is rather more significant is the finding that the dopamine neurons in the caudate – a region of the brain involved in learning stimulus-response associations, and in anticipating food and other 'reward' stimuli – were at their most active around 15 seconds before the participants' favourite moments in the music. The researchers call this the 'anticipatory phase' and argue that the purpose of this activity is to help us predict the arrival of our favourite part. The question, of course, is what all these dopamine neurons are up to. Why are they so active in the period preceding the acoustic climax? After all, we typically associate surges of dopamine with pleasure, with the processing of actual rewards. And yet, this cluster of cells is most active when the 'chills' have yet to arrive, when the melodic pattern is still unresolved.

One way to answer the question is to look at the music and not the neurons. While music can often seem (at least to the outsider) like a labyrinth of intricate patterns, it turns out that the most important part of every song or symphony is when the patterns break down, when the sound becomes unpredictable. If the music is too obvious, it is annoyingly boring, like an alarm clock. Numerous studies, after all, have demonstrated that dopamine neurons quickly adapt to predictable rewards. If we know what's going to happen next, then we don't get excited. This is why composers often introduce a key note in the beginning of a song, spend most of the rest of the piece in the studious avoidance of the pattern, and then finally repeat it only at the end. The longer we are denied the pattern we expect, the greater the emotional release when the pattern returns, safe and sound.

To demonstrate this psychological principle, the musicologist Leonard Meyer, in his classic book Emotion and Meaning in Music (1956), analysed the 5th movement of Beethoven's String Quartet in C-sharp minor, Op. 131. Meyer wanted to show how music is defined by its flirtation with – but not submission to – our expectations of order. Meyer dissected 50 measures (bars) of the masterpiece, showing how Beethoven begins with the clear statement of a rhythmic and harmonic pattern and then, in an ingenious tonal dance, carefully holds off repeating it. What Beethoven does instead is suggest variations of the pattern. He wants to preserve an element of uncertainty in his music, making our brains beg for the one chord he refuses to give us. Beethoven saves that chord for the end.

According to Meyer, it is the suspenseful tension of music, arising out of our unfulfilled expectations, that is the source of the music's feeling. While earlier theories of music focused on the way a sound can refer to the real world of images and experiences – its 'connotative' meaning – Meyer argued that the emotions we find in music come from the unfolding events of the music itself. This 'embodied meaning' arises from the patterns the symphony invokes and then ignores. It is this uncertainty that triggers the surge of dopamine in the caudate, as we struggle to figure out what will happen next. We can predict some of the notes, but we can't predict them all, and that is what keeps us listening, waiting expectantly for our reward, for the pattern to be completed.

Questions 27–31
Complete the summary below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
Write your answers in boxes 27–31 on your answer sheet.

The Montreal Study
Participants, who were recruited for the study through advertisements, had their brain activity monitored while listening to their favourite music. It was noted that the music stimulated the brain's neurons to release a substance called 27 ............... in two of the parts of the brain which are associated with feeling 28 ............... .
Researchers also observed that the neurons in the area of the brain called the 29 ............... were particularly active just before the participants' favourite moments in the music – the period known as the 30 ............... . Activity in this part of the brain is associated with the expectation of 'reward' stimuli such as 31 ............... .

Questions 32–36
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 32–36 on your answer sheet.

32 What point does the writer emphasise in the first paragraph?
A how dramatically our reactions to music can vary
B how intense our physical responses to music can be
C how little we know about the way that music affects us
D how much music can tell us about how our brains operate

33 What view of the Montreal study does the writer express in the second paragraph?
A Its aims were innovative.
B The approach was too simplistic.
C It produced some remarkably precise data.
D The technology used was unnecessarily complex.

34 What does the writer find interesting about the results of the Montreal study?
A the timing of participants' neural responses to the music
B the impact of the music on participants' emotional state
C the section of participants' brains which was activated by the music
D the type of music which had the strongest effect on participants' brains

35 Why does the writer refer to Meyer's work on music and emotion?
A to propose an original theory about the subject
B to offer support for the findings of the Montreal study
C to recommend the need for further research into the subject
D to present a view which opposes that of the Montreal researchers

36 According to Leonard Meyer, what causes the listener's emotional response to music?
A the way that the music evokes poignant memories in the listener
B the association of certain musical chords with certain feelings
C the listener's sympathy with the composer's intentions
D the internal structure of the musical composition

Questions 37–40
Complete each sentence with the correct ending, A–F, below.
Write the correct letter, A–F, in boxes 37–40 on your answer sheet.

37 The Montreal researchers discovered that
38 Many studies have demonstrated that
39 Meyer's analysis of Beethoven's music shows that
40 Earlier theories of music suggested that

A our response to music depends on our initial emotional state.
B neuron activity decreases if outcomes become predictable.
C emotive music can bring to mind actual pictures and events.
D experiences in our past can influence our emotional reaction to music.
E emotive music delays giving listeners what they expect to hear.
F neuron activity increases prior to key points in a musical piece."""

    sentence_endings_opts = [
        {"label": "A", "text": "our response to music depends on our initial emotional state."},
        {"label": "B", "text": "neuron activity decreases if outcomes become predictable."},
        {"label": "C", "text": "emotive music can bring to mind actual pictures and events."},
        {"label": "D", "text": "experiences in our past can influence our emotional reaction to music."},
        {"label": "E", "text": "emotive music delays giving listeners what they expect to hear."},
        {"label": "F", "text": "neuron activity increases prior to key points in a musical piece."},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "GAP_FILL", "content": {"stem": "release a substance called ________ in two of the parts of the brain", "blank": True}, "correctAnswer": "dopamine"},
        {"number": 28, "order": 27, "type": "GAP_FILL", "content": {"stem": "which are associated with feeling ________ .", "blank": True}, "correctAnswer": "pleasure"},
        {"number": 29, "order": 28, "type": "GAP_FILL", "content": {"stem": "the neurons in the area of the brain called the ________ were particularly active", "blank": True}, "correctAnswer": "caudate"},
        {"number": 30, "order": 29, "type": "GAP_FILL", "content": {"stem": "just before the participants' favourite moments in the music – the period known as the ________ .", "blank": True}, "correctAnswer": "anticipatory phase"},
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "associated with the expectation of 'reward' stimuli such as ________ .", "blank": True}, "correctAnswer": "food"},
        {"number": 32, "order": 31, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer emphasise in the first paragraph?", "options": [{"label": "A", "text": "how dramatically our reactions to music can vary"}, {"label": "B", "text": "how intense our physical responses to music can be"}, {"label": "C", "text": "how little we know about the way that music affects us"}, {"label": "D", "text": "how much music can tell us about how our brains operate"}]}, "correctAnswer": "B"},
        {"number": 33, "order": 32, "type": "MULTIPLE_CHOICE", "content": {"stem": "What view of the Montreal study does the writer express in the second paragraph?", "options": [{"label": "A", "text": "Its aims were innovative."}, {"label": "B", "text": "The approach was too simplistic."}, {"label": "C", "text": "It produced some remarkably precise data."}, {"label": "D", "text": "The technology used was unnecessarily complex."}]}, "correctAnswer": "C"},
        {"number": 34, "order": 33, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer find interesting about the results of the Montreal study?", "options": [{"label": "A", "text": "the timing of participants' neural responses to the music"}, {"label": "B", "text": "the impact of the music on participants' emotional state"}, {"label": "C", "text": "the section of participants' brains which was activated by the music"}, {"label": "D", "text": "the type of music which had the strongest effect on participants' brains"}]}, "correctAnswer": "A"},
        {"number": 35, "order": 34, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why does the writer refer to Meyer's work on music and emotion?", "options": [{"label": "A", "text": "to propose an original theory about the subject"}, {"label": "B", "text": "to offer support for the findings of the Montreal study"}, {"label": "C", "text": "to recommend the need for further research into the subject"}, {"label": "D", "text": "to present a view which opposes that of the Montreal researchers"}]}, "correctAnswer": "B"},
        {"number": 36, "order": 35, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Leonard Meyer, what causes the listener's emotional response to music?", "options": [{"label": "A", "text": "the way that the music evokes poignant memories in the listener"}, {"label": "B", "text": "the association of certain musical chords with certain feelings"}, {"label": "C", "text": "the listener's sympathy with the composer's intentions"}, {"label": "D", "text": "the internal structure of the musical composition"}]}, "correctAnswer": "D"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "The Montreal researchers discovered that", "options": sentence_endings_opts}, "correctAnswer": "F"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "Many studies have demonstrated that", "options": sentence_endings_opts}, "correctAnswer": "B"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "Meyer's analysis of Beethoven's music shows that", "options": sentence_endings_opts}, "correctAnswer": "E"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "Earlier theories of music suggested that", "options": sentence_endings_opts}, "correctAnswer": "C"},
    ]

    reading_draft = {
        "title": "Test 29.C12.03 - Reading",
        "slug": "test-29-reading",
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
