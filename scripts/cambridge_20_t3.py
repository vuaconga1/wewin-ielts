# Test 25: Cambridge 20 Test 3 (Test 25.C20.03)
import json
import os

def get_test_25():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Furniture rental companies

Peak Rentals
● Prices range from 105 dollars to 1 ............... dollars per room per month
● The furniture is very 2 ...............
● Delivers in 1–2 days
● Special offer: free 3 ............... with every living room set

4 ............... and Oliver
● Mid-range prices
● 12% monthly fee for 5 ...............
● Also offers a cleaning service

Larch Furniture
● Offers cheapest prices for renting furniture and 6 ............... items
● Must have own 7 ...............
● Minimum contract: 6 months

8 ............... Co
● Order using their 9 ...............
● Free 10 ............... of furniture items"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Prices range from 105 dollars to ________ dollars per room per month", "blank": True}, "correctAnswer": "239", "acceptableAnswers": ["239", "two hundred and thirty-nine", "two hundred and thirty nine"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "The furniture is very ________", "blank": True}, "correctAnswer": "modern"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Special offer: free ________ with every living room set", "blank": True}, "correctAnswer": "lamp"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Name of company: ________ and Oliver", "blank": True}, "correctAnswer": "Aaron"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "12% monthly fee for ________", "blank": True}, "correctAnswer": "damage"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "renting furniture and ________ items", "blank": True}, "correctAnswer": "electronic"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Must have own ________", "blank": True}, "correctAnswer": "insurance"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Name of company: ________ Co", "blank": True}, "correctAnswer": "Space"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Order using their ________", "blank": True}, "correctAnswer": "app"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Free ________ of furniture items", "blank": True}, "correctAnswer": "exchanges"},
    ]

    s2_content = """Questions 11–16
Choose the correct letter, A, B, or C.

Bidcaster Community Archaeology Project
11 Who was responsible for starting the community project?
A the castle owners
B a national charity
C the local council

12 How was the gold coin found?
A Heavy rain had removed some of the soil.
B The ground was dug up by wild rabbits.
C A person with a metal detector searched the area.

13 What led the archaeologists to believe there was an ancient village on this site?
A the lucky discovery of old records
B the bases of several structures visible in the grass
C the unusual stones found near the castle

14 What are the team still hoping to find?
A everyday pottery
B animal bones
C pieces of jewellery

15 What was found on the other side of the river from the castle?
A the remains of a large palace
B the outline of fields
C a number of small huts

16 What do the team plan to do after work ends this summer?
A prepare a display for a museum
B take part in a television programme
C start to organise school visits

Questions 17–20
Label the map below.
Write the correct letter, A–G, next to Questions 17–20.

![Bidcaster Archaeological Dig](/uploads/images/test-25-map.png)

17 bridge foundations
18 rubbish pit
19 meeting hall
20 fish pond"""

    map_opts = [{"label": c, "text": f"Location {c}"} for c in "ABCDEFG"]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Who was responsible for starting the community project?", "options": [{"label": "A", "text": "the castle owners"}, {"label": "B", "text": "a national charity"}, {"label": "C", "text": "the local council"}]}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "How was the gold coin found?", "options": [{"label": "A", "text": "Heavy rain had removed some of the soil."}, {"label": "B", "text": "The ground was dug up by wild rabbits."}, {"label": "C", "text": "A person with a metal detector searched the area."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "What led the archaeologists to believe there was an ancient village on this site?", "options": [{"label": "A", "text": "the lucky discovery of old records"}, {"label": "B", "text": "the bases of several structures visible in the grass"}, {"label": "C", "text": "the unusual stones found near the castle"}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are the team still hoping to find?", "options": [{"label": "A", "text": "everyday pottery"}, {"label": "B", "text": "animal bones"}, {"label": "C", "text": "pieces of jewellery"}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What was found on the other side of the river from the castle?", "options": [{"label": "A", "text": "the remains of a large palace"}, {"label": "B", "text": "the outline of fields"}, {"label": "C", "text": "a number of small huts"}]}, "correctAnswer": "B"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "What do the team plan to do after work ends this summer?", "options": [{"label": "A", "text": "prepare a display for a museum"}, {"label": "B", "text": "take part in a television programme"}, {"label": "C", "text": "start to organise school visits"}]}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "bridge foundations", "options": map_opts}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "rubbish pit", "options": map_opts}, "correctAnswer": "A"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "meeting hall", "options": map_opts}, "correctAnswer": "G"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "fish pond", "options": map_opts}, "correctAnswer": "E"},
    ]

    s3_content = """Questions 21–26
Choose the correct letter, A, B, or C.

Project on Theatre Programmes
21 Finn was pleased to discover that their topic
A was not familiar to their module leader.
B had not been chosen by other students.
C did not prove to be difficult to research.

22 Maya says a mistaken belief about theatre programmes is that
A Theatres pay companies to produce them.
B Few theatre-goers buy them nowadays.
C They contain far more adverts than previously.

23 Finn was surprised that, in early British theatre, programmes
A were difficult for audiences to obtain.
B were given out free of charge.
C were seen as a kind of contract.

24 Maya feels their project should include an explanation of why companies of actors
A promoted their own plays.
B performed plays outdoors.
C had to tour with their plays.

25 Finn and Maya both think that, compared to nineteenth-century programmes, those from the eighteenth century
A were more original.
B were more colourful.
C were more informative.

26 Maya doesn't fully understand why, in the twentieth century,
A Very few theatre programmes were printed in the USA.
B British theatre programmes failed to develop for so long.
C Theatre programmes in Britain copied fashions from the USA.

Questions 27–30
What comment is made about the programme for each of the following shows?
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 27–30.

Comments about programme
A Its origin is somewhat controversial
B It is historically significant for a country.
C It was effective at attracting audiences
D It is included in a recent project
E It contains insights into the show
F It resembles an artwork.

Show
27 Ruy Blas
28 Man of La Mancha
29 The Tragedy of Jane Shore
30 The Sailors' Festival"""

    programme_opts = [
        {"label": "A", "text": "Its origin is somewhat controversial"},
        {"label": "B", "text": "It is historically significant for a country."},
        {"label": "C", "text": "It was effective at attracting audiences"},
        {"label": "D", "text": "It is included in a recent project"},
        {"label": "E", "text": "It contains insights into the show"},
        {"label": "F", "text": "It resembles an artwork."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Finn was pleased to discover that their topic", "options": [{"label": "A", "text": "was not familiar to their module leader."}, {"label": "B", "text": "had not been chosen by other students."}, {"label": "C", "text": "did not prove to be difficult to research."}]}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Maya says a mistaken belief about theatre programmes is that", "options": [{"label": "A", "text": "Theatres pay companies to produce them."}, {"label": "B", "text": "Few theatre-goers buy them nowadays."}, {"label": "C", "text": "They contain far more adverts than previously."}]}, "correctAnswer": "A"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Finn was surprised that, in early British theatre, programmes", "options": [{"label": "A", "text": "were difficult for audiences to obtain."}, {"label": "B", "text": "were given out free of charge."}, {"label": "C", "text": "were seen as a kind of contract."}]}, "correctAnswer": "C"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Maya feels their project should include an explanation of why companies of actors", "options": [{"label": "A", "text": "promoted their own plays."}, {"label": "B", "text": "performed plays outdoors."}, {"label": "C", "text": "had to tour with their plays."}]}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Finn and Maya both think that, compared to nineteenth-century programmes, those from the eighteenth century", "options": [{"label": "A", "text": "were more original."}, {"label": "B", "text": "were more colourful."}, {"label": "C", "text": "were more informative."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "Maya doesn't fully understand why, in the twentieth century,", "options": [{"label": "A", "text": "Very few theatre programmes were printed in the USA."}, {"label": "B", "text": "British theatre programmes failed to develop for so long."}, {"label": "C", "text": "Theatre programmes in Britain copied fashions from the USA."}]}, "correctAnswer": "B"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Ruy Blas", "options": programme_opts}, "correctAnswer": "F"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Man of La Mancha", "options": programme_opts}, "correctAnswer": "E"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "The Tragedy of Jane Shore", "options": programme_opts}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "The Sailors' Festival", "options": programme_opts}, "correctAnswer": "D"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Inclusive design

Definition
● Designing products that can be accessed by a diverse range of people without the need for any 31 ...............
● Not the same as universal design: that is design for everyone, including catering for people with 32 ............... problems

Examples of inclusive design
● 33 ............... which are adjustable, avoiding back or neck problems
● 34 ............... in public toilets which are easier to use

To assist the elderly:
● Designers avoid using 35 ............... in interfaces
● People can make commands using a mouse, keyboard or their 36 ...............

Impact of non-inclusive designs
● Access
  - Loss of independence for disabled people.
● Safety
  - Seatbelts are especially problematic for 37 ............... women.
  - PPE jackets are often unsuitable because of the size of women's 38 ...............
  - PPE for female 39 ............... officers dealing with emergencies is the worst.
● Comfort in the workplace
  - The 40 ............... in offices is often too low for women."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "without the need for any ________", "blank": True}, "correctAnswer": "adaptation"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "catering for people with ________ problems", "blank": True}, "correctAnswer": "cognitive"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "________ which are adjustable, avoiding back or neck problems", "blank": True}, "correctAnswer": "desks"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "________ in public toilets which are easier to use", "blank": True}, "correctAnswer": "taps"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Designers avoid using ________ in interfaces", "blank": True}, "correctAnswer": "blue"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "People can make commands using a mouse, keyboard or their ________", "blank": True}, "correctAnswer": "voice"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "Seatbelts are especially problematic for ________ women.", "blank": True}, "correctAnswer": "pregnant"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "unsuitable because of the size of women's ________", "blank": True}, "correctAnswer": "shoulders"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "PPE for female ________ officers dealing with emergencies is the worst.", "blank": True}, "correctAnswer": "police"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "The ________ in offices is often too low for women.", "blank": True}, "correctAnswer": "temperature"},
    ]

    listening_draft = {
        "title": "Test 25.C20.03 - Listening",
        "slug": "test-25-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-25-section-1.m4a",
            "/uploads/audio/test-25-section-2.m4a",
            "/uploads/audio/test-25-section-3.m4a",
            "/uploads/audio/test-25-section-4.m4a",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-25-section-1.m4a"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-25-section-2.m4a"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-25-section-3.m4a"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-25-section-4.m4a"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

Frozen Food
A US perspective on the development of the frozen food industry

At some point between 2,000 and 3,000 years ago, inhabitants of the high Andes in South America discovered that potatoes left outside on cold nights froze solid. By stomping on the thawed potatoes the next day to squeeze out moisture and leaving them to freeze again, they produced chuño—a dehydrated, freeze-dried potato that retained its nutrients and could be stored for years without spoiling.

Centuries later, in 1851, the development of refrigerated railway cars in the United States revolutionized food distribution. For the first time, butter, fresh dairy products, and meats could be transported over long distances without rotting, packed in sawdust and cooled with natural ice harvested from northern lakes. By 1880, refrigeration made intercontinental shipping possible: an Australian steamship carrying frozen beef and mutton arrived successfully in London, establishing a global trade in frozen meat.

However, early commercial freezing had major flaws. Slow freezing created large ice crystals that ruptured plant and animal cell membranes, leading to mushy textures and loss of flavor when the food thawed.

The breakthrough came from Clarence Birdseye, an American naturalist and entrepreneur. While working as a fur trader in Labrador, Canada between 1912 and 1917, Birdseye observed Inuit fishermen freezing fish through ice holes in temperatures below minus 40 degrees Celsius. When cooked months later, the rapidly frozen fish tasted virtually indistinguishable from freshly caught fish. Birdseye realized that fast freezing formed tiny ice crystals that left cell walls intact.

Returning to the United States, Birdseye perfected a commercial quick-freeze machine using chilled brine. He also innovated packaging, wrapping food in moisture-proof cellophane inside cartons, and flash-freezing them between refrigerated metal plates under pressure. In 1930, Birdseye launched the first commercial line of frozen foods in Springfield, Massachusetts. Yet widespread adoption stalled because grocers lacked refrigerated display cases and consumers did not own home freezers. It was only during World War II, when tin rationing limited canned foods and affordable home refrigerators proliferated, that frozen food truly became a kitchen staple."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "People conserved the nutritional value of 1 ............... , using a method of freezing then drying.", "blank": True}, "correctAnswer": "potatoes"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "2 ............... was kept cool by ice during transportation in specially adapted trains.", "blank": True}, "correctAnswer": "butter"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Two kinds of 3 ............... were the first frozen food shipped to England.", "blank": True}, "correctAnswer": "meat"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "fast freezing prevented large 4 ............... from forming and damaging food cells.", "blank": True}, "correctAnswer": "crystals"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Birdseye wrapped packages in 5 ...............", "blank": True}, "correctAnswer": "cellophane"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "A shortage of 6 ............... during the war boosted frozen food sales.", "blank": True}, "correctAnswer": "tin"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Widespread ownership of the home 7 ............... allowed families to store frozen meals.", "blank": True}, "correctAnswer": "refrigerator"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "The ice transportation business made some Boston ship owners very wealthy in the early 1800s.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "A disadvantage of the freezing process invented in Australia was that it affected the taste of food.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Clarence Birdseye had intended to work as a fisherman when he went to Labrador.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "Birdseye's flash-freezing method preserved the natural texture of food.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Grocers in Massachusetts were enthusiastic about investing in new display freezers in 1930.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "World War II prompted the invention of new types of packaging for frozen products.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Can the planet's coral reefs be saved?

A Coral reefs are among the most biodiverse and economically valuable ecosystems on Earth. Often referred to as the 'rainforests of the sea', they support more than a quarter of all marine life despite occupying less than one-tenth of one percent of the ocean floor. However, rising sea temperatures caused by climate change represent an existential threat. Conservationists have launched global initiatives with two clear educational goals: to raise public awareness about reef collapse and to train community leaders in reef preservation.

B Corals exist in an essential symbiotic relationship with microscopic algae called zooxanthellae that reside within their tissues. The coral animal uses its stinging tentacles to capture plankton from the water column, but the vast majority of its energy comes from the photosynthesizing algae. In return, the coral provides the algae with a protected environment and the nutrients they need for photosynthesis.

C When sea temperatures climb just one or two degrees Celsius above normal summer maximums for sustained periods, this fragile partnership breaks down. Stressed corals expel their zooxanthellae, losing their vibrant color and exposing the stark white calcium carbonate skeletons underneath. Although this phenomenon is widely termed 'coral bleaching', some marine biologists argue the term is inadequate because it emphasizes the visual change rather than the underlying cellular starvation and vulnerability to disease.

D In recent years, mass bleaching events have swept across the Great Barrier Reef, the Caribbean, and Southeast Asia with unprecedented frequency. Marine ecologists issue grave warnings of further destruction if carbon emissions continue unabated, predicting that over 90% of living coral reefs could disappear within several decades.

E In response to this ecological crisis, scientists are working tirelessly to lessen the problems. At the Zoological Society of London and the Australian Institute of Marine Science, researchers are identifying and breeding 'super corals' that demonstrate natural tolerance to heat and acidifying oceans. By cultivating resilient strains and outplanting them onto damaged reefs, scientists hope to buy critical time for coral ecosystems.

F While restoring degraded reefs is daunting, ongoing conservation efforts offer a beacon of hope. Combining emission reductions with cutting-edge selective breeding and habitat protection may allow coral reefs to persist for future generations."""

    heading_opts = [
        {"label": "i", "text": "Tried and tested solutions"},
        {"label": "ii", "text": "Cooperation beneath the waves"},
        {"label": "iii", "text": "Working to lessen the problems"},
        {"label": "iv", "text": "Disagreement about the accuracy of a certain phrase"},
        {"label": "v", "text": "Two clear educational goals"},
        {"label": "vi", "text": "Promoting hope"},
        {"label": "vii", "text": "A warning of further destruction"},
    ]

    coral_damage_opts = [
        {"label": "A", "text": "a rising number of extreme storms"},
        {"label": "B", "text": "the removal of too many fish from the sea"},
        {"label": "C", "text": "the contamination of the sea from waste"},
        {"label": "D", "text": "increased disease among marine species"},
        {"label": "E", "text": "alterations in the usual flow of water in the seas"},
    ]

    london_zoo_opts = [
        {"label": "A", "text": "They are hoping to expand the numbers of different corals being bred in laboratories."},
        {"label": "B", "text": "They want to identify corals that can cope well with the changed sea conditions."},
        {"label": "C", "text": "They are looking at ways of creating artificial reefs that corals could grow on."},
        {"label": "D", "text": "They are trying out methods that would speed up reproduction in some corals."},
        {"label": "E", "text": "They are investigating materials that might protect reefs from higher temperatures."},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Section A", "options": heading_opts}, "correctAnswer": "v"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Section B", "options": heading_opts}, "correctAnswer": "ii"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Section C", "options": heading_opts}, "correctAnswer": "iv"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Section D", "options": heading_opts}, "correctAnswer": "vii"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Section E", "options": heading_opts}, "correctAnswer": "iii"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Section F", "options": heading_opts}, "correctAnswer": "vi"},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text? (Option 1)", "options": coral_damage_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text? (Option 2)", "options": coral_damage_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements are true of the researchers at London Zoo? (Option 1)", "options": london_zoo_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO of the following statements are true of the researchers at London Zoo? (Option 2)", "options": london_zoo_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "Corals have a number of 24 ............... which they use to collect their food.", "blank": True}, "correctAnswer": "tentacles"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "Algae gain 25 ............... from being inside the coral.", "blank": True}, "correctAnswer": "protection"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "Increases in the warmth of the sea water can remove the 26 ............... from coral.", "blank": True}, "correctAnswer": "color", "acceptableAnswers": ["color", "colour"]},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

Robots and us
Three leaders in their fields answer questions about our relationships with intelligent machines

* terraforming: modifying a planet's atmosphere to suit human needs
** singularity: the point when robots will be able to start creating ever more sophisticated versions of themselves

Martin Rees, Astronomer Royal and co-founder of the Centre for the Study of Existential Risk, believes that robotic intelligence will inevitably surpass human intellect. He suggests that while autonomous machines are crucial for exploring deep space and colonizing distant celestial bodies, humans on Earth will need to place strict boundaries on artificial capabilities to ensure our own security. Furthermore, Rees notes that as robots develop higher autonomy, humanity may face moral dilemmas regarding whether we are treating self-aware entities equitably.

Daniel Wolpert, a neuroscientist and engineer, emphasizes that despite massive progress in computation and deep learning, today's robots remain surprisingly clumsy. A human child possesses fluid motor control and sensory integration that the most advanced robot cannot replicate. He argues that genuine general artificial intelligence—capable of human-like creative imagination and versatile physical problem-solving—remains many decades away. Wolpert views robots as far more immediately beneficial on Earth, performing hazardous manual labor, than in speculative outer-space exploration.

Kathleen Richardson, professor of ethics and culture of robots and AI, cautions against our tendency to anthropomorphize machines. She argues that fear of rogue robots often arises from projecting human vanity and ego onto mindless code. Richardson contends that public alarm over machine dominance is exaggerated, obscuring the tangible, immediate ways algorithmic systems already affect labor and privacy. Rather than dreading a futuristic singularity, society should focus on human responsibility in developing ethical technologies."""

    expert_opts = [
        {"label": "A", "text": "Martin Rees"},
        {"label": "B", "text": "Daniel Wolpert"},
        {"label": "C", "text": "Kathleen Richardson"},
    ]

    robot_endings = [
        {"label": "A", "text": "robots to explore outer space."},
        {"label": "B", "text": "advances made in machine intelligence so far."},
        {"label": "C", "text": "changes made to other planets for our own benefit."},
        {"label": "D", "text": "the harm already done by artificial intelligence"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "For our own safety, humans will need to restrict the abilities of robots.", "options": expert_opts}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "The risk of robots harming us is less serious than humans believe it to be.", "options": expert_opts}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "It will take many decades for robot intelligence to be as imaginative as human intelligence.", "options": expert_opts}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "We may have to start considering whether we are treating robots fairly.", "options": expert_opts}, "correctAnswer": "A"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Robots are probably of more help to us on Earth than in space.", "options": expert_opts}, "correctAnswer": "B"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "The ideas in high-quality science fiction may prove to be just as accurate as those found in the work of mediocre scientists.", "options": expert_opts}, "correctAnswer": "A"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "There are those who look forward to robots developing greater intelligence.", "options": expert_opts}, "correctAnswer": "C"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Richardson and Rees express similar views regarding the ethical aspect of ...............", "options": robot_endings}, "correctAnswer": "C"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "Rees and Wolpert share an opinion about the extent of ...............", "options": robot_endings}, "correctAnswer": "B"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "Wolpert disagrees with Richardson on the question of ...............", "options": robot_endings}, "correctAnswer": "D"},
        {"number": 37, "order": 36, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does Richardson make about fear of machines?", "options": [{"label": "A", "text": "It has grown alongside the development of ever more advanced robots."}, {"label": "B", "text": "It is the result of our inclination to attribute human characteristics to non-human entities."}, {"label": "C", "text": "It has its origins in basic misunderstandings about how inanimate objects function."}, {"label": "D", "text": "It demonstrates a key difference between human intelligence and machine intelligence."}]}, "correctAnswer": "B"},
        {"number": 38, "order": 37, "type": "MULTIPLE_CHOICE", "content": {"stem": "What potential advance does Rees see as a cause for concern?", "options": [{"label": "A", "text": "robots outnumbering people"}, {"label": "B", "text": "robots having abilities which humans do not"}, {"label": "C", "text": "artificial intelligence developing independent thought"}, {"label": "D", "text": "artificial intelligence taking over every aspect of our lives"}]}, "correctAnswer": "C"},
        {"number": 39, "order": 38, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Wolpert emphasise in his response to the question about science fiction?", "options": [{"label": "A", "text": "how science fiction influences our attitudes to robots"}, {"label": "B", "text": "how fundamental robots are to the science fiction genre"}, {"label": "C", "text": "how the image of robots in science fiction has changed over time"}, {"label": "D", "text": "how reactions to similar portrayals of robots in science fiction may vary"}]}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is Richardson doing in her comment about reality and fantasy?", "options": [{"label": "A", "text": "warning people not to confuse one with the other"}, {"label": "B", "text": "outlining ways in which one has impacted on the other"}, {"label": "C", "text": "recommending a change of approach in how people view them"}, {"label": "D", "text": "explaining why scientists have a different perspective on them from other people"}]}, "correctAnswer": "C"},
    ]

    reading_draft = {
        "title": "Test 25.C20.03 - Reading",
        "slug": "test-25-reading",
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
