# Test 32: Cambridge 18 Test 2 (Test 32.C18.02)
import json
import os

def get_test_32():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–5
Complete the notes below.
Write ONE WORD ONLY for each answer.

Working at Milo's Restaurants
Benefits
• 1 ............... provided for all staff
• 2 ............... during weekdays at all Milo's Restaurants
• 3 ............... provided after midnight

Person specification
• must be prepared to work well in a team
• must care about maintaining a high standard of 4 ...............
• must have a qualification in 5 ...............

Questions 6–10
Complete the table below.
Write ONE WORD AND/OR A NUMBER for each answer.

| Location | Job title | Responsibilities include | Pay and conditions |
| --- | --- | --- | --- |
| 6 ............... Street | Breakfast supervisor | Checking portions, etc. are correct<br>Making sure 7 ............... is clean | Starting salary 8 £ ............... per hour<br>Start work at 5.30 a.m. |
| City Road | Junior chef | Supporting senior chefs<br>Maintaining stock and organising 9 ............... | Annual salary £23,000<br>No work on a 10 ............... once a month |"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Benefits: 1 ________ provided for all staff", "blank": True}, "correctAnswer": "training"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "2 ________ during weekdays at all Milo's Restaurants", "blank": True}, "correctAnswer": "discount", "acceptableAnswers": ["discount", "discounts"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "3 ________ provided after midnight", "blank": True}, "correctAnswer": "taxi", "acceptableAnswers": ["taxi", "taxis"]},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "must care about maintaining a high standard of 4 ________", "blank": True}, "correctAnswer": "service"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "must have a qualification in 5 ________", "blank": True}, "correctAnswer": "English"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Location: 6 ________ Street", "blank": True}, "correctAnswer": "Wivenhoe"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Making sure 7 ________ is clean", "blank": True}, "correctAnswer": "equipment"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Starting salary 8 £ ________ per hour", "blank": True}, "correctAnswer": "9.75", "acceptableAnswers": ["9.75", "£9.75"]},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Maintaining stock and organising 9 ________", "blank": True}, "correctAnswer": "deliveries"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "No work on a 10 ________ once a month", "blank": True}, "correctAnswer": "Sunday"},
    ]

    s2_content = """Questions 11 and 12
Choose TWO letters, A–E.
What are the TWO main reasons why this site has been chosen for the housing development?
A It has suitable geographical features.
B There is easy access to local facilities.
C It has good connections with the airport.
D The land is of little agricultural value.
E It will be convenient for workers.

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO aspects of the planned housing development have people given positive feedback about?
A the facilities for cyclists
B the impact on the environment
C the encouragement of good relations between residents
D the low cost of all the accommodation
E the rural location

Questions 15–20
Label the map below.
Write the correct letter, A–I, next to Questions 15–20.

Housing development map

![Housing development](/uploads/images/test-32-map.png)

15 School
16 Sports centre
17 Clinic
18 Community centre
19 Supermarket
20 Playground"""

    housing_site_opts = [
        {"label": "A", "text": "It has suitable geographical features."},
        {"label": "B", "text": "There is easy access to local facilities."},
        {"label": "C", "text": "It has good connections with the airport."},
        {"label": "D", "text": "The land is of little agricultural value."},
        {"label": "E", "text": "It will be convenient for workers."},
    ]

    feedback_opts = [
        {"label": "A", "text": "the facilities for cyclists"},
        {"label": "B", "text": "the impact on the environment"},
        {"label": "C", "text": "the encouragement of good relations between residents"},
        {"label": "D", "text": "the low cost of all the accommodation"},
        {"label": "E", "text": "the rural location"},
    ]

    map_opts = [
        {"label": "A", "text": "Location A"},
        {"label": "B", "text": "Location B"},
        {"label": "C", "text": "Location C"},
        {"label": "D", "text": "Location D"},
        {"label": "E", "text": "Location E"},
        {"label": "F", "text": "Location F"},
        {"label": "G", "text": "Location G"},
        {"label": "H", "text": "Location H"},
        {"label": "I", "text": "Location I"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are the TWO main reasons why this site has been chosen for the housing development? (Option 1)", "options": housing_site_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are the TWO main reasons why this site has been chosen for the housing development? (Option 2)", "options": housing_site_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO aspects of the planned housing development have people given positive feedback about? (Option 1)", "options": feedback_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO aspects of the planned housing development have people given positive feedback about? (Option 2)", "options": feedback_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "School", "options": map_opts}, "correctAnswer": "G"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Sports centre", "options": map_opts}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Clinic", "options": map_opts}, "correctAnswer": "D"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Community centre", "options": map_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Supermarket", "options": map_opts}, "correctAnswer": "H"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Playground", "options": map_opts}, "correctAnswer": "A"},
    ]

    s3_content = """Questions 21–24
Choose the correct letter, A, B or C.

21 Why do the students think the Laki eruption of 1783 is so important?
A It was the most severe eruption in modern times.
B It led to the formal study of volcanoes.
C It had a profound effect on society.

22 What surprised Adam about observations made at the time?
A the number of places producing them
B the contradictions in them
C the lack of scientific data to support them

23 According to Michelle, what did the contemporary sources say about the Laki haze?
A People thought it was similar to ordinary fog.
B It was associated with health issues.
C It completely blocked out the sun for weeks.

24 Adam corrects Michelle when she claims that Benjamin Franklin
A came to the wrong conclusion about the cause of the haze.
B was the first to identify the reason for the haze.
C supported the opinions of other observers about the haze.

Questions 25 and 26
Choose TWO letters, A–E.
Which TWO issues following the Laki eruption surprised the students?
A how widespread the effects were
B how long-lasting the effects were
C the number of deaths it caused
D the speed at which the volcanic ash cloud spread
E how people ignored the warning signs

Questions 27–30
What comment do the students make about the impact of the Laki eruption on the following countries?
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 27–30.

Comments
A This country suffered the most severe loss of life.
B The impact on agriculture was predictable.
C There was a significant increase in deaths of young people.
D Animals suffered from a sickness.
E This country saw the highest rise in food prices in the world.
F It caused a particularly harsh winter.

Countries
27 Iceland
28 Egypt
29 UK
30 USA"""

    eruption_issues_opts = [
        {"label": "A", "text": "how widespread the effects were"},
        {"label": "B", "text": "how long-lasting the effects were"},
        {"label": "C", "text": "the number of deaths it caused"},
        {"label": "D", "text": "the speed at which the volcanic ash cloud spread"},
        {"label": "E", "text": "how people ignored the warning signs"},
    ]

    country_impact_opts = [
        {"label": "A", "text": "This country suffered the most severe loss of life."},
        {"label": "B", "text": "The impact on agriculture was predictable."},
        {"label": "C", "text": "There was a significant increase in deaths of young people."},
        {"label": "D", "text": "Animals suffered from a sickness."},
        {"label": "E", "text": "This country saw the highest rise in food prices in the world."},
        {"label": "F", "text": "It caused a particularly harsh winter."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why do the students think the Laki eruption of 1783 is so important?", "options": [{"label": "A", "text": "It was the most severe eruption in modern times."}, {"label": "B", "text": "It led to the formal study of volcanoes."}, {"label": "C", "text": "It had a profound effect on society."}]}, "correctAnswer": "C"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "What surprised Adam about observations made at the time?", "options": [{"label": "A", "text": "the number of places producing them"}, {"label": "B", "text": "the contradictions in them"}, {"label": "C", "text": "the lack of scientific data to support them"}]}, "correctAnswer": "A"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Michelle, what did the contemporary sources say about the Laki haze?", "options": [{"label": "A", "text": "People thought it was similar to ordinary fog."}, {"label": "B", "text": "It was associated with health issues."}, {"label": "C", "text": "It completely blocked out the sun for weeks."}]}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Adam corrects Michelle when she claims that Benjamin Franklin", "options": [{"label": "A", "text": "came to the wrong conclusion about the cause of the haze."}, {"label": "B", "text": "was the first to identify the reason for the haze."}, {"label": "C", "text": "supported the opinions of other observers about the haze."}]}, "correctAnswer": "B"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO issues following the Laki eruption surprised the students? (Option 1)", "options": eruption_issues_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "B"]},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO issues following the Laki eruption surprised the students? (Option 2)", "options": eruption_issues_opts}, "correctAnswer": "B", "acceptableAnswers": ["A", "B"]},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Iceland", "options": country_impact_opts}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Egypt", "options": country_impact_opts}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "UK", "options": country_impact_opts}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "USA", "options": country_impact_opts}, "correctAnswer": "F"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Pockets
Reason for choice of subject
• They are 31 ............... but can be overlooked by consumers and designers.

Pockets in men's clothes
• Men started to wear 32 ............... in the 18th century.
• A 33 ............... sewed pockets into the lining of the garments.
• The wearer could use the pockets for small items.
• Bigger pockets might be made for men who belonged to a certain type of 34 ............... .

Pockets in women's clothes
• Women's pockets were less 35 ............... than men's.
• Women were very concerned about pickpockets.
• Pockets were produced in pairs using 36 ............... to link them together.
• Pockets hung from the women's 37 ............... under skirts and petticoats.
• Items such as 38 ............... could be reached through a gap in the material.
• Pockets, of various sizes, stayed inside clothing for many decades.
• When dresses changed shape, hidden pockets had a negative effect on the 39 ............... of women.
• Bags called 'pouches' became popular, before women carried a 40 ............... ."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "They are 31 ________ but can be overlooked by consumers and designers.", "blank": True}, "correctAnswer": "convenient"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "Men started to wear 32 ________ in the 18th century.", "blank": True}, "correctAnswer": "suits"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "A 33 ________ sewed pockets into the lining of the garments.", "blank": True}, "correctAnswer": "tailor"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Bigger pockets might be made for men who belonged to a certain type of 34 ________ .", "blank": True}, "correctAnswer": "profession"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Women's pockets were less 35 ________ than men's.", "blank": True}, "correctAnswer": "visible"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Pockets were produced in pairs using 36 ________ to link them together.", "blank": True}, "correctAnswer": "string(s)", "acceptableAnswers": ["string", "strings"]},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Pockets hung from the women's 37 ________ under skirts and petticoats.", "blank": True}, "correctAnswer": "waist(s)", "acceptableAnswers": ["waist", "waists"]},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Items such as 38 ________ could be reached through a gap in the material.", "blank": True}, "correctAnswer": "perfume"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "When dresses changed shape, hidden pockets had a negative effect on the 39 ________ of women.", "blank": True}, "correctAnswer": "image"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "Bags called 'pouches' became popular, before women carried a 40 ________ .", "blank": True}, "correctAnswer": "handbag"},
    ]

    t32_listening = {
        "title": "Test 32.C18.02 - Listening",
        "slug": "test-32-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-32-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-32-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-32-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-32-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_text = """Stonehenge

For centuries, historians and archaeologists have puzzled over the many mysteries of Stonehenge, a prehistoric monument that took an estimated 1,500 years to erect. Located on Salisbury Plain in southern England, it is comprised of roughly 100 massive upright stones placed in a circular layout.

Archaeologists believe England's most iconic prehistoric ruin was built in several stages, with the earliest constructed 5,000 or more years ago. First, Neolithic* Britons used primitive tools, which may have been fashioned out of deer antlers, to dig a massive circular ditch and bank, or henge. Deep pits dating back to that era and located within the circle may have once held a ring of timber posts, according to some scholars.

Several hundred years later, it is thought, Stonehenge's builders hoisted an estimated 80 bluestones, 43 of which remain today, into standing positions and placed them in either a horseshoe or circular formation. These stones have been traced all the way to the Preseli Hills in Wales, some 300 kilometres from Stonehenge. How, then, did prehistoric builders without sophisticated tools or engineering haul these boulders, which weigh up to four tons, over such a great distance?

According to one long-standing theory among archaeologists, Stonehenge's builders fashioned sledges and rollers out of tree trunks to lug the bluestones from the Preseli Hills. They then transferred the boulders onto rafts and floated them first along the Welsh coast and then up the River Avon toward Salisbury Plain; alternatively, they may have towed each stone with a fleet of vessels. More recent archaeological hypotheses have them transporting the bluestones with supersized wicker baskets on a combination of ball bearings and long grooved planks, hauled by oxen.

As early as the 1970s, geologists have been adding their voices to the debate over how Stonehenge came into being. Challenging the classic image of industrious builders pushing, carting, rolling or hauling giant stones from faraway Wales, some scientists have suggested that it was glaciers, not humans, that carried the bluestones to Salisbury Plain. Most archaeologists have remained sceptical about this theory, however, wondering how the forces of nature could possibly have delivered the exact number of stones needed to complete the circle.

The third phase of construction took place around 2000 BCE. At this point, sandstone slabs – known as 'sarsens' – were arranged into an outer crescent or ring; some were assembled into the iconic three-pieced structures called trilithons that stand tall in the centre of Stonehenge. Some 50 of these stones are now visible on the site, which may once have contained many more. Radiocarbon dating has revealed that work continued at Stonehenge until roughly 1600 BCE, with the bluestones in particular being repositioned multiple times.

But who were the builders of Stonehenge? In the 17th century, archaeologist John Aubrey made the claim that Stonehenge was the work of druids, who had important religious, judicial and political roles in Celtic** society. This theory was widely popularized by the antiquarian William Stukeley, who had unearthed primitive graves at the site. Even today, people who identify as modern druids continue to gather at Stonehenge for the summer solstice. However, in the mid-20th century, radiocarbon dating demonstrated that Stonehenge stood more than 1,000 years before the Celts inhabited the region.

Many modern historians and archaeologists now agree that several distinct tribes of people contributed to Stonehenge, each undertaking a different phase of its construction. Bones, tools and other artefacts found on the site seem to support this hypothesis. The first stage was achieved by Neolithic agrarians who were likely to have been indigenous to the British Isles. Later, it is believed, groups with advanced tools and a more communal way of life left their mark on the site. Some believe that they were immigrants from the European continent, while others maintain that they were probably native Britons, descended from the original builders.

If the facts surrounding the architects and construction of Stonehenge remain shadowy at best, the purpose of the striking monument is even more of a mystery. While there is consensus among the majority of modern scholars that Stonehenge once served the function of burial ground, they have yet to determine what other purposes it had.

In the 1960s, the astronomer Gerald Hawkins suggested that the cluster of megalithic stones operated as a form of calendar, with different points corresponding to astrological phenomena such as solstices, equinoxes and eclipses occurring at different times of the year. While his theory has received a considerable amount of attention over the decades, critics maintain that Stonehenge's builders probably lacked the knowledge necessary to predict such events or that England's dense cloud cover would have obscured their view of the skies.

More recently, signs of illness and injury in the human remains unearthed at Stonehenge led a group of British archaeologists to speculate that it was considered a place of healing, perhaps because bluestones were thought to have curative powers.

* Neolithic – The era, also known as the New Stone Age, which began around 12,000 years ago and ended around 3500 BCE
** Celtic – The Celts were people who lived in Britain and northwest Europe during the Iron Age from 600 BCE to 43 CE"""

    p1_q_content = """Questions 1–8
Complete the notes below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
Write your answers in boxes 1–8 on your answer sheet.

Stonehenge
Construction
Stage 1:
• the ditch and henge were dug, possibly using tools made from 1 ...............
• 2 ............... may have been arranged in deep pits inside the circle
Stage 2:
• bluestones from the Preseli Hills were placed in standing position
• theories about the transportation of the bluestones:
  - archaeological:
    o builders used 3 ............... to make sledges and rollers
    o 4 ............... pulled them on giant baskets
  - geological:
    o they were brought from Wales by 5 ...............
Stage 3:
• sandstone slabs were arranged into an outer crescent or ring
Builders
• a theory arose in the 17th century that its builders were Celtic 6 ...............
Purpose
• many experts agree it has been used as a 7 ............... site
• in the 1960s, it was suggested that it worked as a kind of 8 ...............

Questions 9–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 9–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

9 During the third phase of construction, sandstone slabs were placed in both the outer areas and the middle of the Stonehenge site.
10 There is scientific proof that the bluestones stood in the same spot until approximately 1600 BCE.
11 John Aubrey's claim about Stonehenge was supported by 20th-century findings.
12 Objects discovered at Stonehenge seem to indicate that it was constructed by a number of different groups of people.
13 Criticism of Gerald Hawkins' theory about Stonehenge has come mainly from other astronomers."""

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "the ditch and henge were dug, possibly using tools made from 1 ________", "blank": True}, "correctAnswer": "(deer) antlers", "acceptableAnswers": ["antlers", "deer antlers"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "2 ________ may have been arranged in deep pits inside the circle", "blank": True}, "correctAnswer": "(timber) posts", "acceptableAnswers": ["posts", "timber posts"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "builders used 3 ________ to make sledges and rollers", "blank": True}, "correctAnswer": "tree trunks"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "4 ________ pulled them on giant baskets", "blank": True}, "correctAnswer": "oxen"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "they were brought from Wales by 5 ________", "blank": True}, "correctAnswer": "glaciers"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "a theory arose in the 17th century that its builders were Celtic 6 ________", "blank": True}, "correctAnswer": "druids"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "many experts agree it has been used as a 7 ________ site", "blank": True}, "correctAnswer": "burial"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "in the 1960s, it was suggested that it worked as a kind of 8 ________", "blank": True}, "correctAnswer": "calendar"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "During the third phase of construction, sandstone slabs were placed in both the outer areas and the middle of the Stonehenge site.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "There is scientific proof that the bluestones stood in the same spot until approximately 1600 BCE.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "John Aubrey's claim about Stonehenge was supported by 20th-century findings.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Objects discovered at Stonehenge seem to indicate that it was constructed by a number of different groups of people.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Criticism of Gerald Hawkins' theory about Stonehenge has come mainly from other astronomers.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_text = """Living with artificial intelligence

Powerful artificial intelligence (AI) needs to be reliably aligned with human values, but does this mean AI will eventually have to police those values?

This has been the decade of AI, with one astonishing feat after another. A chess-playing AI that can defeat not only all human chess players, but also all previous human-programmed chess machines, after learning the game in just four hours? That's yesterday's news, what's next? True, these prodigious accomplishments are all in so-called narrow AI, where machines perform highly specialised tasks. But many experts believe this restriction is very temporary. By mid-century, we may have artificial general intelligence (AGI) – machines that can achieve human-level performance on the full range of tasks that we ourselves can tackle.

If so, there's little reason to think it will stop there. Machines will be free of many of the physical constraints on human intelligence. Our brains run at slow biochemical processing speeds on the power of a light bulb, and their size is restricted by the dimensions of the human birth canal. It is remarkable what they accomplish, given these handicaps. But they may be as far from the physical limits of thought as our eyes are from the incredibly powerful Webb Space Telescope.

Once machines are better than us at designing even smarter machines, progress towards these limits could accelerate. What would this mean for us? Could we ensure a safe and worthwhile coexistence with such machines? On the plus side, AI is already useful and profitable for many things, and super AI might be expected to be super useful, and super profitable. But the more powerful AI becomes, the more important it will be to specify its goals with great care. Folklore is full of tales of people who ask for the wrong thing, with disastrous consequences – King Midas, for example, might have wished that everything he touched turned to gold, but didn't really intend this to apply to his breakfast.

So we need to create powerful AI machines that are 'human-friendly' – that have goals reliably aligned with our own values. One thing that makes this task difficult is that we are far from reliably human-friendly ourselves. We do many terrible things to each other and to many other creatures with whom we share the planet. If superintelligent machines don't do a lot better than us, we'll be in deep trouble. We'll have powerful new intelligence amplifying the dark sides of our own fallible natures.

For safety's sake, then, we want the machines to be ethically as well as cognitively superhuman. We want them to aim for the moral high ground, not for the troughs in which many of us spend some of our time. Luckily they'll be smart enough for the job. If there are routes to the moral high ground, they'll be better than us at finding them, and steering us in the right direction.

However, there are two big problems with this utopian vision. One is how we get the machines started on the journey, the other is what it would mean to reach this destination. The 'getting started' problem is that we need to tell the machines what they're looking for with sufficient clarity that we can be confident they will find it – whatever 'it' actually turns out to be. This won't be easy, given that we are tribal creatures and conflicted about the ideals ourselves. We often ignore the suffering of strangers, and even contribute to it, at least indirectly. How then, do we point machines in the direction of something better?

As for the 'destination' problem, we might, by putting ourselves in the hands of these moral guides and gatekeepers, be sacrificing our own autonomy – an important part of what makes us human. Machines who are better than us at sticking to the moral high ground may be expected to discourage some of the lapses we presently take for granted. We might lose our freedom to discriminate in favour of our own communities, for example.

Loss of freedom to behave badly isn't always a bad thing, of course: denying ourselves the freedom to put children to work in factories, or to smoke in restaurants are signs of progress. But are we ready for ethical silicon police limiting our options? They might be so good at doing it that we won't notice them; but few of us are likely to welcome such a future.

These issues might seem far-fetched, but they are to some extent already here. AI already has some input into how resources are used in our National Health Service (NHS) here in the UK, for example. If it was given a greater role, it might do so much more efficiently than humans can manage, and act in the interests of taxpayers and those who use the health system. However, we'd be depriving some humans (e.g. senior doctors) of the control they presently enjoy. Since we'd want to ensure that people are treated equally and that policies are fair, the goals of AI would need to be specified correctly.

We have a new powerful technology to deal with – itself, literally, a new way of thinking. For our own safety, we need to point these new thinkers in the right direction, and get them to act well for us. It is not yet clear whether this is possible, but if it is, it will require a cooperative spirit, and a willingness to set aside self-interest.

Both general intelligence and moral reasoning are often thought to be uniquely human capacities. But safety seems to require that we think of them as a package: if we are to give general intelligence to machines, we'll need to give them moral authority, too. And where exactly would that leave human beings? All the more reason to think about the destination now, and to be careful about what we wish for."""

    p2_q_content = """Questions 14–19
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 14–19 on your answer sheet.

14 What point does the writer make about AI in the first paragraph?
A It is difficult to predict how quickly AI will progress.
B Much can be learned about the use of AI in chess machines.
C The future is unlikely to see limitations on the capabilities of AI.
D Experts disagree on which specialised tasks AI will be able to perform.

15 What is the writer doing in the second paragraph?
A explaining why machines will be able to outperform humans
B describing the characteristics that humans and machines share
C giving information about the development of machine intelligence
D indicating which aspects of humans are the most advanced

16 Why does the writer mention the story of King Midas?
A to compare different visions of progress
B to illustrate that poorly defined objectives can go wrong
C to emphasise the need for cooperation
D to point out the financial advantages of a course of action

17 What challenge does the writer refer to in the fourth paragraph?
A encouraging humans to behave in a more principled way
B deciding which values we want AI to share with us
C creating a better world for all creatures on the planet
D ensuring AI is more human-friendly than we are ourselves

18 What does the writer suggest about the future of AI in the fifth paragraph?
A The safety of machines will become a key issue.
B It is hard to know what impact machines will have on the world.
C Machines will be superior to humans in certain respects.
D Many humans will oppose machines having a wider role.

19 Which of the following best summarises the writer's argument in the sixth paragraph?
A More intelligent machines will result in greater abuses of power.
B Machine learning will share very few features with human learning.
C There are a limited number of people with the knowledge to program machines.
D Human shortcomings will make creating the machines we need more difficult.

Questions 20–23
Do the following statements agree with the claims of the writer in Reading Passage 2?
In boxes 20–23 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

20 Machines with the ability to make moral decisions may prevent us from promoting the interests of our communities.
21 Silicon police would need to exist in large numbers in order to be effective.
22 Many people are comfortable with the prospect of their independence being restricted by machines.
23 If we want to ensure that machines act in our best interests, we all need to work together.

Questions 24–26
Complete the summary using the list of phrases, A–F, below.
Write the correct letter, A–F, in boxes 24–26 on your answer sheet.

Using AI in the UK health system
AI currently has a limited role in the way 24 ............... are allocated in the health service. The positive aspect of AI having a bigger role is that it would be more efficient and lead to patient benefits. However, such a change would result, for example, in certain 25 ............... not having their current level of 26 ............... . It is therefore important that AI goals are appropriate so that discriminatory practices could be avoided.

A medical practitioners
B specialised tasks
C available resources
D reduced illness
E professional authority
F technology experts"""

    ai_health_opts = [
        {"label": "A", "text": "medical practitioners"},
        {"label": "B", "text": "specialised tasks"},
        {"label": "C", "text": "available resources"},
        {"label": "D", "text": "reduced illness"},
        {"label": "E", "text": "professional authority"},
        {"label": "F", "text": "technology experts"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about AI in the first paragraph?", "options": [{"label": "A", "text": "It is difficult to predict how quickly AI will progress."}, {"label": "B", "text": "Much can be learned about the use of AI in chess machines."}, {"label": "C", "text": "The future is unlikely to see limitations on the capabilities of AI."}, {"label": "D", "text": "Experts disagree on which specialised tasks AI will be able to perform."}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is the writer doing in the second paragraph?", "options": [{"label": "A", "text": "explaining why machines will be able to outperform humans"}, {"label": "B", "text": "describing the characteristics that humans and machines share"}, {"label": "C", "text": "giving information about the development of machine intelligence"}, {"label": "D", "text": "indicating which aspects of humans are the most advanced"}]}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why does the writer mention the story of King Midas?", "options": [{"label": "A", "text": "to compare different visions of progress"}, {"label": "B", "text": "to illustrate that poorly defined objectives can go wrong"}, {"label": "C", "text": "to emphasise the need for cooperation"}, {"label": "D", "text": "to point out the financial advantages of a course of action"}]}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "What challenge does the writer refer to in the fourth paragraph?", "options": [{"label": "A", "text": "encouraging humans to behave in a more principled way"}, {"label": "B", "text": "deciding which values we want AI to share with us"}, {"label": "C", "text": "creating a better world for all creatures on the planet"}, {"label": "D", "text": "ensuring AI is more human-friendly than we are ourselves"}]}, "correctAnswer": "D"},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer suggest about the future of AI in the fifth paragraph?", "options": [{"label": "A", "text": "The safety of machines will become a key issue."}, {"label": "B", "text": "It is hard to know what impact machines will have on the world."}, {"label": "C", "text": "Machines will be superior to humans in certain respects."}, {"label": "D", "text": "Many humans will oppose machines having a wider role."}]}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which of the following best summarises the writer's argument in the sixth paragraph?", "options": [{"label": "A", "text": "More intelligent machines will result in greater abuses of power."}, {"label": "B", "text": "Machine learning will share very few features with human learning."}, {"label": "C", "text": "There are a limited number of people with the knowledge to program machines."}, {"label": "D", "text": "Human shortcomings will make creating the machines we need more difficult."}]}, "correctAnswer": "D"},
        {"number": 20, "order": 19, "type": "TRUE_FALSE_NG", "content": {"stem": "Machines with the ability to make moral decisions may prevent us from promoting the interests of our communities.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 21, "order": 20, "type": "TRUE_FALSE_NG", "content": {"stem": "Silicon police would need to exist in large numbers in order to be effective.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 22, "order": 21, "type": "TRUE_FALSE_NG", "content": {"stem": "Many people are comfortable with the prospect of their independence being restricted by machines.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "If we want to ensure that machines act in our best interests, we all need to work together.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "AI currently has a limited role in the way 24 ________ are allocated in the health service.", "options": ai_health_opts}, "correctAnswer": "C"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "However, such a change would result, for example, in certain 25 ________", "options": ai_health_opts}, "correctAnswer": "A"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "not having their current level of 26 ________ .", "options": ai_health_opts}, "correctAnswer": "E"},
    ]

    p3_text = """An ideal city

Leonardo da Vinci's ideal city was centuries ahead of its time

The word 'genius' is universally associated with the name of Leonardo da Vinci. A true Renaissance man, he embodied scientific spirit, artistic talent and humanist sensibilities. Five hundred years have passed since Leonardo died in his home at Château du Clos Lucé, outside Tours, France. Yet far from fading into insignificance, his thinking has carried down the centuries and still surprises today.

The Renaissance marked the transition from the 15th century to modernity and took place after the spread of the plague in the 14th century, which caused a global crisis resulting in some 200 million deaths across Europe and Asia. Today, the world is on the cusp of a climate crisis, which is predicted to cause widespread displacement, extinctions and death, if left unaddressed. Then, as now, radical solutions were called for to revolutionise the way people lived and safeguard humanity against catastrophe.

Around 1486 – after a pestilence that killed half the population in Milan, Italy – Leonardo turned his thoughts to urban planning problems. Following a typical Renaissance trend, he began to work on an 'ideal city' project, which – due to its excessive costs – would remain unfulfilled. Yet given that unsustainable urban models are a key cause of global climate change today, it's only natural to wonder how Leonardo might have changed the shape of modern cities.

Although the Renaissance is renowned as an era of incredible progress in art and architecture, it is rarely noted that the 15th century also marked the birth of urbanism as a true academic discipline. The rigour and method behind the conscious conception of a city had been largely missing in Western thought until the moment when prominent Renaissance men pushed forward large-scale urban projects in Italy, such as the reconfiguration of the town of Pienza and the expansion of the city of Ferrara. These works surely inspired Leonardo's decision to rethink the design of medieval cities, with their winding and overcrowded streets and with houses piled against one another.

It is not easy to identify a coordinated vision of Leonardo's ideal city because of his disordered way of working with notes and sketches. But from the largest collection of Leonardo's papers ever assembled, a series of innovative thoughts can be reconstructed regarding the foundation of a new city along the Ticino River, which runs from Switzerland into Italy and is 248 kilometres long. He designed the city for the easy transport of goods and clean urban spaces, and he wanted a comfortable and spacious city, with well-ordered streets and architecture. He recommended 'high, strong walls', with 'towers and battlements of all necessary and pleasant beauty'.

His plans for a modern and 'rational' city were consistent with Renaissance ideals. But, in keeping with his personality, Leonardo included several innovations in his urban design. Leonardo wanted the city to be built on several levels, linked with vertical outdoor staircases. This design can be seen in some of today's high-rise buildings but was unconventional at the time. Indeed, this idea of taking full advantage of the interior spaces wasn't implemented until the 1920s and 1930s, with the birth of the Modernist movement.

While in the upper layers of the city, people could walk undisturbed between elegant palaces and streets, the lower layer was the place for services, trade, transport and industry. But the true originality of Leonardo's vision was its fusion of architecture and engineering. Leonardo designed extensive hydraulic plants to create artificial canals throughout the city. The canals, regulated by clocks and basins, were supposed to make it easier for boats to navigate inland. Leonardo also thought that the width of the streets ought to match the average height of the adjacent houses: a rule still followed in many contemporary cities across Italy, to allow access to sun and reduce the risk of damage from earthquakes.

Although some of these features existed in Roman cities, before Leonardo's drawings there had never been a multi-level, compact modern city which was thoroughly technically conceived. Indeed, it wasn't until the 19th century that some of his ideas were applied. For example, the subdivision of the city by function – with services and infrastructures located in the lower levels and wide and well-ventilated boulevards and walkways above for residents – is an idea that can be found in Georges-Eugène Haussmann's renovation of Paris under Emperor Napoleon III between 1853 and 1870.

Today, Leonardo's ideas are not simply valid, they actually suggest a way forward for urban planning. Many scholars think that the compact city, built upwards instead of outwards, integrated with nature (especially water systems), with efficient transport infrastructure, could help modern cities become more efficient and sustainable. This is yet another reason why Leonardo was aligned so closely with modern urban planning and centuries ahead of his time."""

    p3_q_content = """Questions 27–33
Do the following statements agree with the information given in Reading Passage 3?
In boxes 27–33 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

27 People first referred to Leonardo da Vinci as a genius 500 years ago.
28 The current climate crisis is predicted to cause more deaths than the plague.
29 Some of the challenges we face today can be compared to those of earlier times.
30 Leonardo da Vinci's 'ideal city' was constructed in the 15th century.
31 Poor town planning is a major contributor to climate change.
32 In Renaissance times, local people fought against the changes to Pienza and Ferrara.
33 Leonardo da Vinci kept a neat, organised record of his designs.

Questions 34–40
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 34–40 on your answer sheet.

Leonardo da Vinci's ideal city
A collection of Leonardo da Vinci's paperwork reveals his design of a new city beside the Ticino River. This was to provide better 34 ............... for trade and a less polluted environment. Although Leonardo da Vinci's city shared many of the ideals of his time, some of his innovations were considered unconventional in their design. They included features that can be seen in some tower blocks today, such as 35 ............... on the exterior of a building.

Leonardo da Vinci wasn't only an architect. His expertise in 36 ............... was evident in his plans for artificial canals within his ideal city. He also believed that the height of houses should relate to the width of streets in case earthquakes occurred. The design of many cities in Italy today follows this 37 ............... .

While some cities from 38 ............... times have aspects that can also be found in Leonardo's designs, his ideas weren't put into practice until long after his death. 39 ............... is one example of a city that was redesigned in the 19th century in the way that Leonardo had envisaged. His ideas are also relevant to today's world, where building 40 ............... no longer seems to be the best approach."""

    p3_questions = [
        {"number": 27, "order": 26, "type": "TRUE_FALSE_NG", "content": {"stem": "People first referred to Leonardo da Vinci as a genius 500 years ago.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 28, "order": 27, "type": "TRUE_FALSE_NG", "content": {"stem": "The current climate crisis is predicted to cause more deaths than the plague.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 29, "order": 28, "type": "TRUE_FALSE_NG", "content": {"stem": "Some of the challenges we face today can be compared to those of earlier times.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 30, "order": 29, "type": "TRUE_FALSE_NG", "content": {"stem": "Leonardo da Vinci's 'ideal city' was constructed in the 15th century.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 31, "order": 30, "type": "TRUE_FALSE_NG", "content": {"stem": "Poor town planning is a major contributor to climate change.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "In Renaissance times, local people fought against the changes to Pienza and Ferrara.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "Leonardo da Vinci kept a neat, organised record of his designs.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "This was to provide better 34 ________ for trade and a less polluted environment.", "blank": True}, "correctAnswer": "transport"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "such as 35 ________ on the exterior of a building.", "blank": True}, "correctAnswer": "staircases"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "His expertise in 36 ________ was evident in his plans for artificial canals within his ideal city.", "blank": True}, "correctAnswer": "engineering"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The design of many cities in Italy today follows this 37 ________ .", "blank": True}, "correctAnswer": "rule"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "While some cities from 38 ________ times have aspects that can also be found in Leonardo's designs,", "blank": True}, "correctAnswer": "Roman"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "39 ________ is one example of a city that was redesigned in the 19th century in the way that Leonardo had envisaged.", "blank": True}, "correctAnswer": "Paris"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "where building 40 ________ no longer seems to be the best approach.", "blank": True}, "correctAnswer": "outwards"},
    ]

    t32_reading = {
        "title": "Test 32.C18.02 - Reading",
        "slug": "test-32-reading",
        "skill": "READING",
        "status": "DRAFT",
        "parts": [
            {"title": "Reading Passage 1", "content": f"{p1_text}\n\n{p1_q_content}", "questions": p1_questions},
            {"title": "Reading Passage 2", "content": f"{p2_text}\n\n{p2_q_content}", "questions": p2_questions},
            {"title": "Reading Passage 3", "content": f"{p3_text}\n\n{p3_q_content}", "questions": p3_questions},
        ]
    }

    return [t32_listening, t32_reading]
