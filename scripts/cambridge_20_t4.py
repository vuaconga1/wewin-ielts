# Test 26: Cambridge 20 Test 4 (Test 26.C20.04)
import json
import os

def get_test_26():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Advice on family visit

Accommodation
● 1 ............... Hotel on George Street
● cost of a family room per night: 2 £............... (approx.)

Recommended trips
● a 3 ............... tour of the city centre (starts in Carlton Square)
● a trip by 4 ............... to the old fort

Science Museum
● best day to visit: 5 ...............
● see the exhibition about 6 ..............., which opens soon

Food
● Clacton Market:
  - good for 7 ...............
  - need to have lunch before 8 ............... p.m.

Theatre tickets
● save up to 9 ............... % on ticket prices at bargaintickets.com

Free activities
● Blakewell Gardens:
  - Roots Music Festival
  - climb Telegraph Hill to see a view of the 10 ..............."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Accommodation: ________ Hotel on George Street", "blank": True}, "correctAnswer": "Kings", "acceptableAnswers": ["Kings", "King's"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "cost of a family room per night: £________ (approx.)", "blank": True}, "correctAnswer": "125", "acceptableAnswers": ["125", "one hundred and twenty-five", "one hundred and twenty five"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "a ________ tour of the city centre (starts in Carlton Square)", "blank": True}, "correctAnswer": "walking"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "a trip by ________ to the old fort", "blank": True}, "correctAnswer": "boat"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "best day to visit: ________", "blank": True}, "correctAnswer": "Tuesday"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "see the exhibition about ________, which opens soon", "blank": True}, "correctAnswer": "space"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Clacton Market: good for ________", "blank": True}, "correctAnswer": "vegetarian", "acceptableAnswers": ["vegetarian", "vegetarians"]},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "need to have lunch before ________ p.m.", "blank": True}, "correctAnswer": "2.30", "acceptableAnswers": ["2.30", "2:30"]},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "save up to ________ % on ticket prices at bargaintickets.com", "blank": True}, "correctAnswer": "75", "acceptableAnswers": ["75", "seventy-five", "seventy five"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "climb Telegraph Hill to see a view of the ________", "blank": True}, "correctAnswer": "port"},
    ]

    s2_content = """Questions 11 and 12
Choose TWO letters, A–E.
Which TWO things does the speaker say about visiting the football stadium with children?
A Children can get their photo taken with a football player.
B There is a competition for children today.
C Parents must stay with their children at all times.
D Children will need sunhats and drinks.
E The café has a special offer on meals for children.

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO features of the stadium tour are new this year?
A VIP tour
B 360 cinema experience
C audio guide
D dressing room tour
E tours in other languages

Questions 15–20
Which event in the history of football in the UK took place in each of the following years?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 15–20.

Events in the history of football
A the introduction of pay for the players
B a change to the design of the goal
C the first use of lights for matches
D the introduction of goalkeepers
E the first international match
F two changes to the rules of the game
G the introduction of a fee for spectators
H an agreement on the length of a game

15 1870
16 1874
17 1875
18 1877
19 1878
20 1880"""

    stadium_children_opts = [
        {"label": "A", "text": "Children can get their photo taken with a football player."},
        {"label": "B", "text": "There is a competition for children today."},
        {"label": "C", "text": "Parents must stay with their children at all times."},
        {"label": "D", "text": "Children will need sunhats and drinks."},
        {"label": "E", "text": "The café has a special offer on meals for children."},
    ]
    tour_features_opts = [
        {"label": "A", "text": "VIP tour"},
        {"label": "B", "text": "360 cinema experience"},
        {"label": "C", "text": "audio guide"},
        {"label": "D", "text": "dressing room tour"},
        {"label": "E", "text": "tours in other languages"},
    ]
    football_history_opts = [
        {"label": "A", "text": "the introduction of pay for the players"},
        {"label": "B", "text": "a change to the design of the goal"},
        {"label": "C", "text": "the first use of lights for matches"},
        {"label": "D", "text": "the introduction of goalkeepers"},
        {"label": "E", "text": "the first international match"},
        {"label": "F", "text": "two changes to the rules of the game"},
        {"label": "G", "text": "the introduction of a fee for spectators"},
        {"label": "H", "text": "an agreement on the length of a game"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does the speaker say about visiting the football stadium with children? (Option 1)", "options": stadium_children_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO things does the speaker say about visiting the football stadium with children? (Option 2)", "options": stadium_children_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO features of the stadium tour are new this year? (Option 1)", "options": tour_features_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO features of the stadium tour are new this year? (Option 2)", "options": tour_features_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "1870", "options": football_history_opts}, "correctAnswer": "D"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "1874", "options": football_history_opts}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "1875", "options": football_history_opts}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "1877", "options": football_history_opts}, "correctAnswer": "H"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "1878", "options": football_history_opts}, "correctAnswer": "C"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "1880", "options": football_history_opts}, "correctAnswer": "G"},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO benefits for children of learning to write did both students find surprising?
A improved fine motor skills
B improved memory
C improved concentration
D improved imagination
E improved spatial awareness

Questions 23 and 24
Choose TWO letters, A–E.
For children with dyspraxia, which TWO problems with handwriting do the students think are easiest to correct?
A not spacing letters correctly
B not writing in a straight line
C applying too much pressure when writing
D confusing letter shapes
E writing very slowly

Questions 25–30
Choose the correct letter, A, B or C.

Teaching handwriting
25 What does the woman say about using laptops to teach writing to children with dyslexia?
A Children often lack motivation to learn that way.
B Children become fluent relatively quickly.
C Children react more positively if they make a mistake.

26 When discussing whether to teach cursive or print writing, the woman thinks that
A Cursive writing disadvantages a certain group of children.
B Print writing is associated with lower academic performance.
C Most teachers in the UK prefer a traditional approach to handwriting.

27 According to the students, what impact does poor handwriting have on exam performance?
A There is evidence to suggest grades are affected by poor handwriting.
B Neat handwriting is less important now than it used to be.
C Candidates write more slowly and produce shorter answers.

28 What prediction does the man make about the future of handwriting?
A Touch typing will be taught before writing by hand.
B Children will continue to learn to write by hand.
C People will dislike handwriting on digital devices.

29 The woman is concerned that relying on digital devices has made it difficult for her to
A take detailed notes.
B spell and punctuate.
C read old documents.

30 How do the students feel about their own handwriting?
A concerned they are unable to write quickly
B embarrassed by comments made about it
C regretful that they have lost the habit"""

    handwriting_benefits_opts = [
        {"label": "A", "text": "improved fine motor skills"},
        {"label": "B", "text": "improved memory"},
        {"label": "C", "text": "improved concentration"},
        {"label": "D", "text": "improved imagination"},
        {"label": "E", "text": "improved spatial awareness"},
    ]
    dyspraxia_opts = [
        {"label": "A", "text": "not spacing letters correctly"},
        {"label": "B", "text": "not writing in a straight line"},
        {"label": "C", "text": "applying too much pressure when writing"},
        {"label": "D", "text": "confusing letter shapes"},
        {"label": "E", "text": "writing very slowly"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO benefits for children of learning to write did both students find surprising? (Option 1)", "options": handwriting_benefits_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO benefits for children of learning to write did both students find surprising? (Option 2)", "options": handwriting_benefits_opts}, "correctAnswer": "E", "acceptableAnswers": ["C", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "For children with dyspraxia, which TWO problems with handwriting do the students think are easiest to correct? (Option 1)", "options": dyspraxia_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "For children with dyspraxia, which TWO problems with handwriting do the students think are easiest to correct? (Option 2)", "options": dyspraxia_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the woman say about using laptops to teach writing to children with dyslexia?", "options": [{"label": "A", "text": "Children often lack motivation to learn that way."}, {"label": "B", "text": "Children become fluent relatively quickly."}, {"label": "C", "text": "Children react more positively if they make a mistake."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "When discussing whether to teach cursive or print writing, the woman thinks that", "options": [{"label": "A", "text": "Cursive writing disadvantages a certain group of children."}, {"label": "B", "text": "Print writing is associated with lower academic performance."}, {"label": "C", "text": "Most teachers in the UK prefer a traditional approach to handwriting."}]}, "correctAnswer": "A"},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the students, what impact does poor handwriting have on exam performance?", "options": [{"label": "A", "text": "There is evidence to suggest grades are affected by poor handwriting."}, {"label": "B", "text": "Neat handwriting is less important now than it used to be."}, {"label": "C", "text": "Candidates write more slowly and produce shorter answers."}]}, "correctAnswer": "A"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What prediction does the man make about the future of handwriting?", "options": [{"label": "A", "text": "Touch typing will be taught before writing by hand."}, {"label": "B", "text": "Children will continue to learn to write by hand."}, {"label": "C", "text": "People will dislike handwriting on digital devices."}]}, "correctAnswer": "B"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "The woman is concerned that relying on digital devices has made it difficult for her to", "options": [{"label": "A", "text": "take detailed notes."}, {"label": "B", "text": "spell and punctuate."}, {"label": "C", "text": "read old documents."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "How do the students feel about their own handwriting?", "options": [{"label": "A", "text": "concerned they are unable to write quickly"}, {"label": "B", "text": "embarrassed by comments made about it"}, {"label": "C", "text": "regretful that they have lost the habit"}]}, "correctAnswer": "C"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Research in the area around Chembe Bird Sanctuary

The importance of birds of prey to the local communities
● They destroy 31 ............... and other rodents.
● They help to prevent farmers from being bitten by 32 ...............
● They have been an important part of the local culture for many years.
● They now support the economy by encouraging 33 ............... in the area.

Falling numbers of birds of prey
● The birds may be accidentally killed by 34 ............... when they are hunting or sleeping
● by electrocution from contact with power lines, especially at times when there are a lot of 35 ...............
● Local farmers may illegally shoot them or 36 ............... them.

Ways of protecting chickens from birds of prey
● clearing away vegetation from the area (unhelpful)
● providing a 37 ............... for chickens (expensive)
● frightening birds of prey by
  - keeping a 38 ...............
  - making a 39 ............... - e.g. with metal objects
● A 40 ............... of methods is usually most effective."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "They destroy 31 ________ and other rodents.", "blank": True}, "correctAnswer": "rats", "acceptableAnswers": ["rats", "rodents"]},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "prevent farmers from being bitten by 32 ________", "blank": True}, "correctAnswer": "snakes"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "encouraging 33 ________ in the area.", "blank": True}, "correctAnswer": "tourism"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "accidentally killed by 34 ________ when they are hunting or sleeping", "blank": True}, "correctAnswer": "traffic"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "especially at times when there are a lot of 35 ________", "blank": True}, "correctAnswer": "rain"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Local farmers may illegally shoot them or 36 ________ them.", "blank": True}, "correctAnswer": "poison"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "providing a 37 ________ for chickens (expensive)", "blank": True}, "correctAnswer": "building"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "keeping a 38 ________", "blank": True}, "correctAnswer": "dog"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "making a 39 ________ - e.g. with metal objects", "blank": True}, "correctAnswer": "noise"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "A 40 ________ of methods is usually most effective.", "blank": True}, "correctAnswer": "combination"},
    ]

    listening_draft = {
        "title": "Test 26.C20.04 - Listening",
        "slug": "test-26-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-26-section-1.m4a",
            "/uploads/audio/test-26-section-2.m4a",
            "/uploads/audio/test-26-section-3.m4a",
            "/uploads/audio/test-26-section-4.m4a",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-26-section-1.m4a"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-26-section-2.m4a"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-26-section-3.m4a"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-26-section-4.m4a"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

Georgia O'Keeffe
For seven decades, Georgia O'Keeffe (1887–1986) was a major figure in American art. Remarkably, as she accounted for her independence from shifting artistic fashions, she remained fiercely true to her personal vision.

Born in Sun Prairie, Wisconsin, O'Keeffe knew from a young age that she wanted to be an artist. After studying at the Art Institute of Chicago and the Art Students League of New York, she worked as an art teacher in Texas, Virginia, and South Carolina. During this period, feeling frustrated by traditional representational painting, she began producing highly original charcoal drawings exploring pure organic abstraction.

When these charcoal drawings were shown to Alfred Stieglitz, the pioneering photographer and modern art promoter in New York, he immediately recognized her genius and exhibited them at his 291 Gallery in 1916. O'Keeffe moved to New York in 1918, beginning a professional and romantic partnership with Stieglitz, whom she later married.

During the 1920s, O'Keeffe became famous for two distinct bodies of work: striking paintings of New York's soaring skyscrapers, capturing the city's architectural modernism, and dramatic, magnified close-up paintings of flowers. By blowing blossoms up to monumental scale, she forced hurried urban viewers to truly see and contemplate the beauty of nature.

In 1929, seeking fresh inspiration, O'Keeffe visited New Mexico for the first time. The stark high-desert landscape, vast open skies, and adobe architecture enchanted her. She collected bleached animal bones and skulls from the desert sands, juxtaposing them with vivid desert landscapes. She also painted desert rivers, cliffs, and the red hills of Ghost Ranch, where she established a permanent home in 1940. She continued working in New Mexico until her death at the age of 98, cementing her legacy as the 'Mother of American Modernism'."""

    tfng_opts = [{"label": "TRUE", "text": "TRUE"}, {"label": "FALSE", "text": "FALSE"}, {"label": "NOT GIVEN", "text": "NOT GIVEN"}]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "studied art, then worked as a 1 ............... in various places in the USA", "blank": True}, "correctAnswer": "teacher"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "created drawings using 2 ............... which were exhibited in New York City", "blank": True}, "correctAnswer": "charcoal"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "moved to New York and became famous for her paintings of the city's 3 ...............", "blank": True}, "correctAnswer": "skyscrapers"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "produced a series of innovative close-up paintings of 4 ...............", "blank": True}, "correctAnswer": "flowers"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "collected sun-bleached 5 ............... from the desert", "blank": True}, "correctAnswer": "bones"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "was inspired by the stark New Mexico 6 ...............", "blank": True}, "correctAnswer": "landscape"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "captured the dramatic forms of desert 7 ............... and mountains", "blank": True}, "correctAnswer": "rivers"},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "When O'Keeffe finished high school, she had already made her mind up about the profession she wanted to follow.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Stieglitz asked O'Keeffe's permission before displaying her charcoal drawings in his gallery.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "The scale of O'Keeffe's flower paintings was intended to make people look at nature with greater attention.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "O'Keeffe preferred the weather in New Mexico to the weather in New York.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "O'Keeffe's late paintings of clouds were painted from photographs taken on plane flights.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Adapting to the effects of climate change

A All around the world, nations are already having to confront the physical fallout of a warming planet. While global mitigation targets aim to curb emissions, climate scientists predict it could take generations before humanity stops noticing the adverse effects of existing atmospheric carbon. As a result, cities and rural communities are urgently pioneering practical adaptation measures.

B Coastal cities are particularly vulnerable to sea-level rise and heightened tidal flooding. In Miami Beach, Florida, municipal engineers have raised street elevations and installed high-capacity stormwater pumps to expel saltwater back into Biscayne Bay during astronomical 'king tides'. Similarly, in low-lying deltas across Asia, coastal communities are embracing nature-based solutions.

C In Indonesia, coastal restoration teams have learned that planting dense belts of mangroves provides natural storm surge buffers that absorb wave energy far more effectively than concrete sea walls. To protect saplings from destructive currents during early growth, engineers constructed offshore brushwood permeable dams to calm incoming surf.

D Elsewhere, adaptation takes innovative architectural forms. In Vietnam's flood-prone Mekong Delta, architects designed amphibious floating houses that rest on the ground in dry seasons but rise and float buoyantly when inundations occur. In Bangladesh, where saltwater intrusion spoils inland aquifers, agronomists have introduced salt-tolerant crops, allowing subsistence farmers to cultivate fertile soils that were previously abandoned.

E Extreme heat is another catastrophic hazard. In densely populated urban areas, the urban heat island effect exacerbates dangerously high summer temperatures. In Los Angeles, chief heat officer Greg Spotts launched the 'cool pavement' initiative, coating asphalt streets with solar-reflective sealant and planting shade trees to cool neighborhoods by several degrees.

F Modern adaptation also leverages sophisticated satellite mapping and AI-assisted geospatial modeling to identify neighborhoods most vulnerable to extreme climate impacts. Experts like Susanna Tol of Wetlands International emphasize that long-term resilience succeeds only when local communities actively participate in designing and maintaining their own adaptation strategies."""

    para_climate_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEF"]
    people_climate_opts = [
        {"label": "A", "text": "Yanira Pineda"},
        {"label": "B", "text": "Susanna Tol"},
        {"label": "C", "text": "Elizabeth English"},
        {"label": "D", "text": "Jeff Goodell"},
        {"label": "E", "text": "Greg Spotts"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "how a type of plant functions as a natural protection for coastlines", "options": para_climate_opts}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "a prediction about how long it could take to stop noticing the effects of climate change", "options": para_climate_opts}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "a reference to the fact that a solution is particularly cost-effective", "options": para_climate_opts}, "correctAnswer": "D"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "a mention of a technology used to locate areas most in need of intervention", "options": para_climate_opts}, "correctAnswer": "F"},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "The stormwater-management programme in Miami Beach has involved the installation of efficient 18 ...............", "blank": True}, "correctAnswer": "pumps"},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "The construction of 19 ............... was the first stage of a project to ensure the success of mangroves in Indonesia.", "blank": True}, "correctAnswer": "dams"},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can 20 ...............", "blank": True}, "correctAnswer": "float"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "Rising sea levels in Bangladesh have made it necessary to introduce various 21 ............... that are suitable for areas of high salt content.", "blank": True}, "correctAnswer": "crops"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "A project in LA has increased the number of 22 ............... on the city's streets.", "blank": True}, "correctAnswer": "trees"},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "It is essential to adopt strategies which involve and help residents of the region.", "options": people_climate_opts}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "Interventions which reduce heat are absolutely vital for our survival in this location.", "options": people_climate_opts}, "correctAnswer": "E"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "More work will need to be done in future decades to deal with the impact of rising water levels.", "options": people_climate_opts}, "correctAnswer": "A"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "The number of locations requiring action to adapt to flooding has grown in recent years.", "options": people_climate_opts}, "correctAnswer": "C"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

A new role for livestock guard dogs
Livestock guard dogs, traditionally used to protect farm animals from predators, are now being used to protect the predators themselves

A For thousands of years, livestock guard dogs worked alongside shepherds to protect their sheep, goats and cattle from wolves, bears, and other carnivores. Unlike herding dogs, which control livestock movements through stalking and barking, guard dogs are raised from puppyhood with the herd. They bond closely with the livestock, viewing them as family and defending them with quiet determination.

B When predators approach, the guard dogs position themselves between the herd and the threat, barking loudly and displaying formidable posturing. Most wild predators avoid physical confrontation when confronted with such large, confident dogs. Consequently, carnivores move elsewhere to seek wild prey rather than risking injury attacking domestic herds.

C Academic researchers have documented the remarkable success of guard dog programs across multiple continents. In studies conducted across Europe, North America, and Australia, guard dogs consistently reduced livestock losses by over 70 to 90 percent. Silvia Ribeiro of the Portuguese NGO Grupo Lobo found that guard dogs provided an effective, non-lethal deterrent that dramatically improved coexistence between ranchers and wolves.

D Crucially, protecting livestock also saves the predators. In Namibia, where commercial ranchers historically shot or trapped cheetahs that preyed on goats, the Cheetah Conservation Fund introduced Anatolian Shepherd dogs. With the dogs guarding herds, livestock losses plummeted by over 80 percent. As a direct result, farmers no longer retaliated against cheetahs, transforming the world's largest wild cheetah population from imminent peril into stable recovery.

E However, researchers like Julie Young and Bethany Smith point out that introducing guard dogs can sometimes cause unexpected ecological ripple effects. In Namibia, while cheetah predation declined, guard dogs sometimes killed smaller native carnivores like jackals and bat-eared foxes. Dogs can also transmit infectious diseases or outcompete wild scavengers for resources.

F Furthermore, as Dan Macon, a livestock specialist, emphasizes, training a livestock guardian requires an entirely different approach from training a pet or working sheepdog. Guard dogs must operate autonomously with minimal human direction, displaying absolute fidelity to their flock.

G Despite these challenges, wildlife biologists see immense potential in guard dogs as vital conservation partners. By minimizing economic conflict between rural livelihoods and apex predators, these loyal guardians prove that domestic animals can play an indispensable role in safeguarding wild biodiversity."""

    para_dog_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEFG"]
    people_dog_opts = [
        {"label": "A", "text": "Dan Macon"},
        {"label": "B", "text": "Silvia Ribeiro"},
        {"label": "C", "text": "Linda van Bommel"},
        {"label": "D", "text": "Julie Young"},
        {"label": "E", "text": "Bethany Smith"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "an example of how one predator has been protected by the introduction of livestock guard dogs", "options": para_dog_opts}, "correctAnswer": "D"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "an optimistic suggestion about the possible positive developments in the use of livestock guard dogs", "options": para_dog_opts}, "correctAnswer": "G"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "a description of how the methods used by livestock guard dogs help to keep predators away", "options": para_dog_opts}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "claims by different academics that the use of livestock guard dogs is a successful way of protecting farmers' herds", "options": para_dog_opts}, "correctAnswer": "C"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "a reference to how livestock guard dogs gain their skills", "options": para_dog_opts}, "correctAnswer": "B"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "The use of guard dogs may save the lives of both livestock and wild animals.", "options": people_dog_opts}, "correctAnswer": "D"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "Claims of a change in behaviour from those using livestock guard dogs may not be totally accurate.", "options": people_dog_opts}, "correctAnswer": "E"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "There may be negative results if the use of livestock guard dogs is not sufficiently widespread.", "options": people_dog_opts}, "correctAnswer": "B"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "Livestock guard dogs are the best way of protecting farm animals, as long as the dogs are appropriately handled.", "options": people_dog_opts}, "correctAnswer": "C"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "Teaching a livestock guard dog how to do its work needs a different focus from teaching a house guard dog.", "options": people_dog_opts}, "correctAnswer": "A"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "This has led to a rise in the deaths of other predators, particularly 37 ...............", "blank": True}, "correctAnswer": "jackals"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "it has been suggested that the dogs could have 38 ..............., which may affect other species", "blank": True}, "correctAnswer": "diseases"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "and that they may reduce the amount of 39 ............... available to certain wild animals.", "blank": True}, "correctAnswer": "food"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "These might otherwise be threatened by predators such as 40 ...............", "blank": True}, "correctAnswer": "foxes"},
    ]

    reading_draft = {
        "title": "Test 26.C20.04 - Reading",
        "slug": "test-26-reading",
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
