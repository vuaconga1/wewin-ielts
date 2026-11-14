# Test 23: Cambridge 20 Test 1 (Test 23.C20.01)
import json
import os

def get_test_23():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Restaurant Recommendations

Name of restaurant | Location | Reason for recommendation | Other comments
The Junction | Greyson Street, near the station | Good for people who are especially keen on 1 ............... | Quite expensive; The 2 ............... is a good place for a drink
Paloma | In Bow Street next to the cinema | 3 ............... food, good for sharing | Staff are very friendly; Need to pay 50 deposit; A limited selection of 4 ............... on the menu
The 5 ............... | At the top of a 6 ............... | A famous chef; All the 7 ............... are very good; Only uses 8 ............... ingredients | Set lunch cost: 9 ............... per person; Portions probably of 10 ............... size"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Good for people who are especially keen on ________", "blank": True}, "correctAnswer": "fish"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "The ________ is a good place for a drink", "blank": True}, "correctAnswer": "roof"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "________ food, good for sharing", "blank": True}, "correctAnswer": "Spanish"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "A limited selection of ________ on the menu", "blank": True}, "correctAnswer": "vegetarian", "acceptableAnswers": ["vegetarian", "vegetarians"]},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Name of restaurant: The ________", "blank": True}, "correctAnswer": "Audley"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "At the top of a ________", "blank": True}, "correctAnswer": "hotel"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "All the ________ are very good", "blank": True}, "correctAnswer": "reviews", "acceptableAnswers": ["reviews", "review"]},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Only uses ________ ingredients", "blank": True}, "correctAnswer": "local"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Set lunch cost: £________ per person", "blank": True}, "correctAnswer": "30", "acceptableAnswers": ["30", "thirty", "£30", "£thirty"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Portions probably of ________ size", "blank": True}, "correctAnswer": "average"},
    ]

    s2_content = """Questions 11–16
Choose the correct letter, A, B or C.

Heather and Edelman Pottery
11 Heather says pottery differs from other art forms because
A It lasts longer in the ground.
B It is practiced by more people.
C It can be repaired more easily.

12 Archaeologists sometimes identify the use of ancient pottery from
A the clay it was made with.
B the marks that are on it.
C the basic shape of it.

13 Some people join Heather's pottery class because they want to
A create an item that looks very old.
B find something that they are good at.
C make something that will outlive them.

14 What does Heather value most about being a potter?
A Its calming effect
B Its messy nature
C Its physical benefits

15 Most of the visitors to Edelman Pottery
A bring friends to join courses.
B have never made a pot before.
C try to learn techniques too quickly.

16 Heather reminds her visitors that they should
A put on their aprons.
B change their clothes.
C take off their jewellery.

Questions 17 and 18
Choose TWO letters, A–E.
Which TWO things does Heather explain about kilns?
A what their function is
B when they were invented
C ways of keeping them safe
D where to put one in your home
E what some people use instead of one

Questions 19 and 20
Choose TWO letters, A–E.
Which TWO points does Heather make about a potter's tools?
A Some are hard to hold.
B Some are worth buying.
C Some are essential items.
D Some have memorable names.
E Some are available for use by participants."""

    kiln_opts = [
        {"label": "A", "text": "what their function is"},
        {"label": "B", "text": "when they were invented"},
        {"label": "C", "text": "ways of keeping them safe"},
        {"label": "D", "text": "where to put one in your home"},
        {"label": "E", "text": "what some people use instead of one"},
    ]
    tool_opts = [
        {"label": "A", "text": "Some are hard to hold."},
        {"label": "B", "text": "Some are worth buying."},
        {"label": "C", "text": "Some are essential items."},
        {"label": "D", "text": "Some have memorable names."},
        {"label": "E", "text": "Some are available for use by participants."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Heather says pottery differs from other art forms because", "options": [{"label": "A", "text": "It lasts longer in the ground."}, {"label": "B", "text": "It is practiced by more people."}, {"label": "C", "text": "It can be repaired more easily."}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Archaeologists sometimes identify the use of ancient pottery from", "options": [{"label": "A", "text": "the clay it was made with."}, {"label": "B", "text": "the marks that are on it."}, {"label": "C", "text": "the basic shape of it."}]}, "correctAnswer": "B"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Some people join Heather's pottery class because they want to", "options": [{"label": "A", "text": "create an item that looks very old."}, {"label": "B", "text": "find something that they are good at."}, {"label": "C", "text": "make something that will outlive them."}]}, "correctAnswer": "C"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Heather value most about being a potter?", "options": [{"label": "A", "text": "Its calming effect"}, {"label": "B", "text": "Its messy nature"}, {"label": "C", "text": "Its physical benefits"}]}, "correctAnswer": "A"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "Most of the visitors to Edelman Pottery", "options": [{"label": "A", "text": "bring friends to join courses."}, {"label": "B", "text": "have never made a pot before."}, {"label": "C", "text": "try to learn techniques too quickly."}]}, "correctAnswer": "B"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "Heather reminds her visitors that they should", "options": [{"label": "A", "text": "put on their aprons."}, {"label": "B", "change": "B", "text": "change their clothes."}, {"label": "C", "text": "take off their jewellery."}]}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does Heather explain about kilns? (Option 1)", "options": kiln_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does Heather explain about kilns? (Option 2)", "options": kiln_opts}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Heather make about a potter's tools? (Option 1)", "options": tool_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO points does Heather make about a potter's tools? (Option 2)", "options": tool_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO things do the students both believe are responsible for the increase in loneliness?
A social media
B smaller nuclear families
C urban design
D longer lifespans
E a mobile workforce

Questions 23 and 24
Choose TWO letters, A–E.
Which TWO health risks associated with loneliness do the students agree are based on solid evidence?
A a weakened immune system
B dementia
C cancer
D obesity
E cardiovascular disease

Questions 25 and 26
Choose TWO letters, A–E.
Which TWO opinions do both the students express about the evolutionary theory of loneliness?
A It has little practical relevance.
B It needs further investigation.
C It is misleading.
D It should be more widely accepted.
E It is difficult to understand.

Questions 27–30
Choose the correct letter, A, B or C.

Loneliness and mental health
27 When comparing loneliness to depression, the students
A doubt that there will ever be a medical cure for loneliness.
B claim that the link between loneliness and mental health is overstated.
C express frustration that loneliness is not taken more seriously.

28 Why do the students decide to start their presentation with an example from their own experience?
A to explain how difficult loneliness can be
B to highlight a situation that most students will recognise
C to emphasise that feeling lonely is more common for men than women

29 The students agree that talking to strangers is a good strategy for dealing with loneliness because
A it creates a sense of belonging.
B it builds self-confidence.
C it makes people feel more positive.

30 The students find it difficult to understand why solitude is considered to be
A similar to loneliness.
B necessary for mental health.
C an enjoyable experience."""

    loneliness_cause_opts = [
        {"label": "A", "text": "social media"},
        {"label": "B", "text": "smaller nuclear families"},
        {"label": "C", "text": "urban design"},
        {"label": "D", "text": "longer lifespans"},
        {"label": "E", "text": "a mobile workforce"},
    ]
    health_risk_opts = [
        {"label": "A", "text": "a weakened immune system"},
        {"label": "B", "text": "dementia"},
        {"label": "C", "text": "cancer"},
        {"label": "D", "text": "obesity"},
        {"label": "E", "text": "cardiovascular disease"},
    ]
    theory_opts = [
        {"label": "A", "text": "It has little practical relevance."},
        {"label": "B", "text": "It needs further investigation."},
        {"label": "C", "text": "It is misleading."},
        {"label": "D", "text": "It should be more widely accepted."},
        {"label": "E", "text": "It is difficult to understand."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students both believe are responsible for the increase in loneliness? (Option 1)", "options": loneliness_cause_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things do the students both believe are responsible for the increase in loneliness? (Option 2)", "options": loneliness_cause_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO health risks associated with loneliness do the students agree are based on solid evidence? (Option 1)", "options": health_risk_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO health risks associated with loneliness do the students agree are based on solid evidence? (Option 2)", "options": health_risk_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO opinions do both the students express about the evolutionary theory of loneliness? (Option 1)", "options": theory_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "B"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO opinions do both the students express about the evolutionary theory of loneliness? (Option 2)", "options": theory_opts}, "correctAnswer": "B", "acceptableAnswers": ["A", "B"]},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "When comparing loneliness to depression, the students", "options": [{"label": "A", "text": "doubt that there will ever be a medical cure for loneliness."}, {"label": "B", "text": "claim that the link between loneliness and mental health is overstated."}, {"label": "C", "text": "express frustration that loneliness is not taken more seriously."}]}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why do the students decide to start their presentation with an example from their own experience?", "options": [{"label": "A", "text": "to explain how difficult loneliness can be"}, {"label": "B", "text": "to highlight a situation that most students will recognise"}, {"label": "C", "text": "to emphasise that feeling lonely is more common for men than women"}]}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students agree that talking to strangers is a good strategy for dealing with loneliness because", "options": [{"label": "A", "text": "it creates a sense of belonging."}, {"label": "B", "text": "it builds self-confidence."}, {"label": "C", "text": "it makes people feel more positive."}]}, "correctAnswer": "A"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students find it difficult to understand why solitude is considered to be", "options": [{"label": "A", "text": "similar to loneliness."}, {"label": "B", "text": "necessary for mental health."}, {"label": "C", "text": "an enjoyable experience."}]}, "correctAnswer": "C"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Reclaiming urban rivers

Historical background
● Nearly all major cities were built on a river.
● Rivers were traditionally used by city dwellers for transport, fishing and recreation.
● Industrial development and rising populations later led to:
  - more sewage from houses being discharged into the river
  - pollution from 31 ............... on the river bank.
● In 1957, the River Thames in London was declared biologically 32 ...............

Recent improvements
● Seals and even a 33 ............... have been seen in the River Thames.
● Riverside warehouses are converted to restaurants and 34 ...............
● In Los Angeles, there are plans to:
  - build a riverside 35 ...............
  - display 36 ............... projects
● In Paris, 37 ............... are created on the sides of the river every summer.

Transport possibilities
● Over 2 billion passengers already travel by 38 ...............
● Changes in shopping habits mean the number of deliveries that are made is increasing
● Instead of road transport, goods could be transported by large freight barges and electric 39 ..............., or in the future, by 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "pollution from ________ on the river bank.", "blank": True}, "correctAnswer": "factories"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "In 1957, the River Thames in London was declared biologically ________", "blank": True}, "correctAnswer": "dead"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Seals and even a ________ have been seen in the River Thames.", "blank": True}, "correctAnswer": "whale"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Riverside warehouses are converted to restaurants and ________", "blank": True}, "correctAnswer": "apartments"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "build a riverside ________", "blank": True}, "correctAnswer": "park"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "display ________ projects", "blank": True}, "correctAnswer": "art"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "In Paris, ________ are created on the sides of the river every summer.", "blank": True}, "correctAnswer": "beaches"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Over 2 billion passengers already travel by ________", "blank": True}, "correctAnswer": "ferry"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "goods could be transported by large freight barges and electric ________", "blank": True}, "correctAnswer": "bikes"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "or in the future, by ________", "blank": True}, "correctAnswer": "drone"},
    ]

    listening_draft = {
        "title": "Test 23.C20.01 - Listening",
        "slug": "test-23-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-23-section-1.m4a",
            "/uploads/audio/test-23-section-2.m4a",
            "/uploads/audio/test-23-section-3.m4a",
            "/uploads/audio/test-23-section-4.m4a",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-23-section-1.m4a"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-23-section-2.m4a"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-23-section-3.m4a"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-23-section-4.m4a"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

The kākāpō
The kākāpō is a nocturnal, flightless parrot that is critically endangered and one of New Zealand's unique treasures.

The kākāpō, also known as the owl parrot, is a large, forest-dwelling bird, with a pale owl-like face. Up to 64 cm in length, it has predominantly yellow-green feathers, forward-facing eyes, a large grey beak, large blue feet, and relatively short wings and tail. It is the world's only flightless parrot, and is also possibly one of the world's longest-living birds, with a reported lifespan of up to 90 years.

The kākāpō is entirely vegetarian. Its diet includes the leaves, buds, flowers and bark of trees, as well as fern fronds, mosses, bulbs and fungi. The birds nest on the ground, usually under the cover of dense vegetation, or in cavities such as hollow tree trunks or rock crevices. Between one and four eggs are laid in each breeding season, but the birds do not necessarily breed every year. When kākāpō do breed, it is usually in response to the abundant production of fruit by trees such as the rimu, which happens every two to four years. Unusually for birds, male kākāpō play no part in incubating eggs or rearing young; the female looks after the eggs and chicks alone.

Kākāpō were once common throughout New Zealand's North, South and Stewart Islands. Māori settlers hunted them for their meat and used their feathers to make valuable cloaks. They also brought dogs and the Polynesian rat (kiore), both of which were efficient predators. But the decline was accelerated by European colonisation. A great deal of habitat was lost through forest clearance, and introduced species such as deer depleted the remaining forests of food. Other predators such as cats, stoats and two more species of rat were also introduced. The kākāpō were in serious trouble.

In 1894, the New Zealand government launched its first attempt to save the kākāpō. Richard Henry, an early conservationist, moved hundreds of kākāpō to Resolution Island, a predator-free haven. Unfortunately, stoats managed to swim to the island within a decade, devastating the population. By the mid-20th century, kākāpō were feared to be functionally extinct, with only a handful of old male birds surviving in the rugged mountains of Fiordland.

In 1977, however, a population of male and female kākāpō was found on Rakiura (Stewart Island). Sadly, feral cats were killing the birds at an alarming rate. By 1980, conservationists made the decision to evacuate all surviving birds to predator-free offshore islands. Between 1980 and 1992, 61 kākāpō were moved to islands such as Codfish Island (Whenua Hou) and Little Barrier Island.

The kākāpō Recovery Plan was launched in 1989. Intensive management included supplementary feeding, artificial incubation of eggs, hand-rearing of vulnerable chicks, and close health monitoring. Genomic sequencing of every living kākāpō has also provided vital information on genetic diversity. For the first time, there was cautious optimism for the future of kākāpō and by June 2020, a total of 210 birds was recorded.

Today, kākāpō management continues to be guided by the kākāpō Recovery Plan. Its key goals are: minimise the loss of genetic diversity in the kākāpō population, restore or maintain sufficient habitat to accommodate the expected increase in the kākāpō population, and ensure stakeholders continue to be fully engaged in the preservation of the species."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "There are other parrots that share the kākāpō's inability to fly.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "Adult kākāpō produce chicks every year.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "Adult male kākāpō bring food back to nesting females.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "The Polynesian rat was a greater threat to the kākāpō than Polynesian settlers.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "Kākāpō were transferred from Rakiura Island to other locations because they were at risk from feral cats.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 6, "order": 5, "type": "TRUE_FALSE_NG", "content": {"stem": "One Recovery Plan initiative that helped increase the kākāpō population size was caring for struggling young birds.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "diet consists of fern fronds, various parts of a tree and 7 ...............", "blank": True}, "correctAnswer": "bulbs", "acceptableAnswers": ["bulbs", "bulb"]},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "nests are created in 8 ............... where eggs are laid.", "blank": True}, "correctAnswer": "soil"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "the 9 ............... of the kākāpō were used to make clothes.", "blank": True}, "correctAnswer": "feathers", "acceptableAnswers": ["feathers", "feather"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "10 ............... were an animal which they introduced that ate the kākāpō's food sources.", "blank": True}, "correctAnswer": "deer"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "a definite sighting of female kākāpō on Rakiura Island was reported in the year 11 ...............", "blank": True}, "correctAnswer": "1980"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "the Recovery Plan included an increase in 12 ...............", "blank": True}, "correctAnswer": "funding"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "a current goal of the Recovery Plan is to maintain the involvement of 13 ............... in kākāpō protection.", "blank": True}, "correctAnswer": "stakeholders", "acceptableAnswers": ["stakeholders", "stakeholder"]},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Bring elms to Britain
Mark Rowe investigates attempts to reintroduce elms to Britain

A Around 25 million elms, accounting for 90% of all elm trees in the UK, died during the 1960s and 1970s as a result of Dutch elm disease, which is caused by a fungus spread by elm bark beetles. The loss reshaped the British landscape and had profound ecological effects, destroying the habitats of numerous birds, insects, and lichens that depended on the trees.

B The disease is believed to have entered Britain via imported logs from North America. The beetles bore beneath the bark to lay eggs, creating tunnels and inadvertently introducing the fungus. The tree's vascular system reacts by attempting to block the fungal spread, ultimately suffocating itself by preventing the flow of water and nutrients to its crown.

C While mature elms were largely wiped out, root systems survived and produced young suckers. However, once these suckers grow to a diameter of around 10–15 cm, their bark becomes thick enough to attract the bark beetle, resulting in a recurring cycle of infection and dieback before the trees reach maturity. This makes it difficult for researchers to study the long-term prospects of naturally regenerating trees.

D Before the epidemic, elms were ubiquitous across the countryside. For centuries, the only tree more prevalent than the elm was the oak. Elm wood was prized for its durability under water and resistance to splitting. Historically, it was chosen for water pipes, boat building, and carts. During the Bronze Age it was used for weapons and tools, and later for items subject to heavy impact, including mining equipment and the keel of the 19th-century clipper Cutty Sark.

E In Brighton and Hove, on England's south coast, several thousand mature elms survived. The city's geography provided natural insulation: the English Channel to the south and the rolling South Downs to the north created physical barriers that slowed the beetle's entry. Coupled with stringent council inspection and felling of infected trees, this pocket of trees managed to endure.

F Conservationists are now exploring two main routes to re-establishing elms. One involves identifying mature 'survivor' trees that may possess natural genetic resistance, cloning them, and planting them in test plots. Another approach involves introducing resistant hybrids and cultivars developed in Europe and the United States, such as 'Lutece' and 'Ulmus New Horizon'.

G However, opinion is divided on the wisdom of planting non-native cultivars. Some scientists argue that these foreign hybrids lack the authentic ecological relationships of native English elms, potentially offering fewer benefits to British insects and wildlife. Others contend that in the face of climate change and continued disease pressure, hybrid varieties represent the only realistic chance of restoring the tree to British hedgerows."""

    section_opts = [{"label": c, "text": f"Section {c}"} for c in "ABCDEFG"]
    people_opts = [
        {"label": "A", "text": "Matt Elliot"},
        {"label": "B", "text": "Karen Russell"},
        {"label": "C", "text": "Peter Bourne"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "reference to the research problems that arise from there being only a few surviving large elms", "options": section_opts}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "details of a difference of opinion about the value of reintroducing elms to Britain", "options": section_opts}, "correctAnswer": "G"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "reference to how Dutch elm disease was brought into Britain", "options": section_opts}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a description of the conditions that have enabled a location in Britain to escape Dutch elm disease", "options": section_opts}, "correctAnswer": "E"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "reference to the stage at which young elms become vulnerable to Dutch elm disease", "options": section_opts}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "If a tree gets infected with Dutch elm disease, the damage rapidly becomes visible.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "It may be better to wait and see if the mature elms that have survived continue to flourish.", "options": people_opts}, "correctAnswer": "A"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "There must be an explanation for the survival of some mature elms.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "We need to be aware that insects carrying Dutch elm disease are not very far away.", "options": people_opts}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "You understand the motivation for planting elms that show resistance.", "options": people_opts}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "For hundreds of years, the only tree that was more popular in Britain than elm was 24 ...............", "blank": True}, "correctAnswer": "oak"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "In the 18th century, it was grown to provide wood for boxes and 25 ...............", "blank": True}, "correctAnswer": "flooring"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "the Cutty Sark's 26 ............... was also constructed from elm.", "blank": True}, "correctAnswer": "keel"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

How stress affects our judgement
Some of the most important decisions of our lives occur while we're feeling stressed and anxious. From medical decisions to financial and professional ones, we are all sometimes required to weigh up options under pressure.

To investigate how stress alters decision-making, our research team looked at firefighters in Colorado. Firefighters operate under acute stress when responding to emergencies, but when resting back at the fire station, their stress levels decrease dramatically. This variation makes them an exceptional group for study without the need to induce artificial laboratory anxiety.

In our experiments, we assessed firefighters' risk perception and information processing during both relaxed and high-stress shifts. When relaxed, they exhibited a standard human bias towards optimism: they tended to discount negative news and incorporate positive news into their beliefs. However, when called out to alarms and experiencing high cortisol levels and elevated heart rates, this bias vanished. Under stress, they became remarkably receptive to warning signals and negative data, rapidly revising their risk calculations downwards.

We replicated these findings in our university laboratory with students facing a surprise public speaking challenge. The cortisol surge made the participants hyper-attentive to warnings and threatening news. Evolutionarily, this shift makes obvious sense. When facing imminent danger, an animal or human cannot afford optimism; survival depends on noticing every hazard and over-estimating potential threats.

However, in modern society, this mechanism can have unintended consequences. Constant exposure to anxiety-provoking headlines on social media and news feeds triggers chronic stress. This heightened stress causes people to absorb and amplify more alarming information, creating a self-reinforcing loop of anxiety. Consequently, people may cancel travel unnecessarily or make irrational financial decisions, selling stocks at the worst possible moment.

Yet stress and anxiety are not the only contagious emotional states. Hope and positive motivation also spread across social groups. Understanding how stress reshapes our perception allows us to frame public messages more thoughtfully and prevent unnecessary panic."""

    sentence_endings = [
        {"label": "A", "text": "made them feel optimistic."},
        {"label": "B", "text": "took relatively little notice of bad news."},
        {"label": "C", "text": "responded to negative and positive information in the same way."},
        {"label": "D", "text": "were feeling under stress."},
        {"label": "E", "text": "put them in a stressful situation."},
        {"label": "F", "text": "behaved in a similar manner, regardless of the circumstances."},
        {"label": "G", "text": "thought it more likely that they would experience something bad."},
    ]
    ynng_opts = [{"label": "YES", "text": "YES"}, {"label": "NO", "text": "NO"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the first paragraph, the writer introduces the topic of the text by", "options": [{"label": "A", "text": "defining some commonly used terms."}, {"label": "B", "text": "questioning a widely held assumption."}, {"label": "C", "text": "mentioning a challenge faced by everyone."}, {"label": "D", "text": "specifying a situation which makes us most anxious."}]}, "correctAnswer": "C"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about firefighters in the second paragraph?", "options": [{"label": "A", "text": "The regular changes of stress levels in their working lives make them ideal study subjects."}, {"label": "B", "text": "The strategies they use to handle stress are of particular interest to researchers."}, {"label": "C", "text": "They are more likely than others to experience high levels of stress."}, {"label": "D", "text": "They find it harder to make decisions when under stress than in normal conditions."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the third paragraph, the writer outlines the firefighters' study by", "options": [{"label": "A", "text": "highlighting a surprising outcome."}, {"label": "B", "text": "comparing it with other studies."}, {"label": "C", "text": "analysing the participants' responses."}, {"label": "D", "text": "describing their methodology."}]}, "correctAnswer": "D"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the writer, the evolutionary response to stress", "options": [{"label": "A", "text": "developed in response to the spread of disease."}, {"label": "B", "text": "leads to a decrease in our physical capabilities."}, {"label": "C", "text": "produces heightened sensitivity to indications of external threats."}, {"label": "D", "text": "is activated when there is a need to communicate a sense of danger."}]}, "correctAnswer": "C"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "At times when they were relaxed, the firefighters usually ...............", "options": sentence_endings}, "correctAnswer": "B"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "The researchers noted that when the firefighters were stressed, they ...............", "options": sentence_endings}, "correctAnswer": "G"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "In the laboratory experiment, the students ...............", "options": sentence_endings}, "correctAnswer": "F"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "The researchers' preparation of the students ...............", "options": sentence_endings}, "correctAnswer": "E"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "In both experiments, negative information was processed better when the subjects ...............", "options": sentence_endings}, "correctAnswer": "D"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "The tone of the content we post on social media tends to reflect the nature of the posts in our feeds.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Phones have a greater impact on our stress levels than other electronic media devices.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "The more we read about a stressful public event on social media, the less able we are to take effective action.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "Stress created by social media posts can lead us to take unnecessary precautions.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "Our tendency to be affected by other people's moods can be used in a positive way.", "options": ynng_opts}, "correctAnswer": "YES"},
    ]

    reading_draft = {
        "title": "Test 23.C20.01 - Reading",
        "slug": "test-23-reading",
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
