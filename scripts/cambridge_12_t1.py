# Test 27: Cambridge 12 Test 1 (Test 27.C12.01)
import json
import os

def get_test_27():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

FAMILY EXCURSIONS
Cruise on a lake
Example
• Travel on an old steamship
• Can take photos of the 1 ............... that surround the lake

Farm visit
• Children can help feed the sheep
• Visit can include a 40-minute ride on a 2 ...............
• Visitors can walk in the farm's 3 ............... by the lake
• 4 ............... is available at extra cost

Cycling trips
Cyclists explore the Back Road
• A 5 ............... is provided
• Only suitable for cyclists who have some 6 ...............
• Bikes can be hired from 7 ............... (near the Cruise Ship Terminal)
Cyclists need:
- a repair kit
- food and drink
- a 8 ............... (can be hired)
• There are no 9 ............... or accommodation in the area

Cost
• Total cost for whole family of cruise and farm visit: $ 10 ..............."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Can take photos of the ________ that surround the lake", "blank": True}, "correctAnswer": "mountains"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Visit can include a 40-minute ride on a ________", "blank": True}, "correctAnswer": "horse"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Visitors can walk in the farm's ________ by the lake", "blank": True}, "correctAnswer": "gardens", "acceptableAnswers": ["gardens", "garden"]},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "________ is available at extra cost", "blank": True}, "correctAnswer": "lunch"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "A ________ is provided", "blank": True}, "correctAnswer": "map"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Only suitable for cyclists who have some ________", "blank": True}, "correctAnswer": "experience"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Bikes can be hired from ________ (near the Cruise Ship Terminal)", "blank": True}, "correctAnswer": "Ratchesons"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "a ________ (can be hired)", "blank": True}, "correctAnswer": "helmet"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "There are no ________ or accommodation in the area", "blank": True}, "correctAnswer": "shops"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Total cost for whole family of cruise and farm visit: $________", "blank": True}, "correctAnswer": "267", "acceptableAnswers": ["267", "$267", "267 dollars"]},
    ]

    s2_content = """Questions 11–14
Choose the correct letter, A, B or C.

Talk to new kitchen assistants
11 According to the manager, what do most people like about the job of kitchen assistant?
A the variety of work
B the friendly atmosphere
C the opportunities for promotion

12 The manager is concerned about some of the new staff's
A jewellery.
B hair styles.
C shoes.

13 The manager says that the day is likely to be busy for kitchen staff because
A it is a public holiday.
B the head chef is absent.
C the restaurant is almost fully booked.

14 Only kitchen staff who are 18 or older are allowed to use
A the waste disposal unit.
B the electric mixer.
C the meat slicer.

Questions 15 and 16
Choose TWO letters, A–E.
According to the manager, which TWO things can make the job of kitchen assistant stressful?
A They have to follow orders immediately.
B The kitchen gets very hot.
C They may not be able to take a break.
D They have to do overtime.
E The work is physically demanding.

Questions 17–20
What is the responsibility of each of the following restaurant staff?
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 17–20.

Responsibilities
A training courses
B food stocks
C first aid
D breakages
E staff discounts
F timetables

Restaurant staff
17 Joy Parkins
18 David Field
19 Dexter Wills
20 Mike Smith"""

    stress_opts = [
        {"label": "A", "text": "They have to follow orders immediately."},
        {"label": "B", "text": "The kitchen gets very hot."},
        {"label": "C", "text": "They may not be able to take a break."},
        {"label": "D", "text": "They have to do overtime."},
        {"label": "E", "text": "The work is physically demanding."},
    ]

    resp_opts = [
        {"label": "A", "text": "training courses"},
        {"label": "B", "text": "food stocks"},
        {"label": "C", "text": "first aid"},
        {"label": "D", "text": "breakages"},
        {"label": "E", "text": "staff discounts"},
        {"label": "F", "text": "timetables"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the manager, what do most people like about the job of kitchen assistant?", "options": [{"label": "A", "text": "the variety of work"}, {"label": "B", "text": "the friendly atmosphere"}, {"label": "C", "text": "the opportunities for promotion"}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "The manager is concerned about some of the new staff's", "options": [{"label": "A", "text": "jewellery."}, {"label": "B", "text": "hair styles."}, {"label": "C", "text": "shoes."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "The manager says that the day is likely to be busy for kitchen staff because", "options": [{"label": "A", "text": "it is a public holiday."}, {"label": "B", "text": "the head chef is absent."}, {"label": "C", "text": "the restaurant is almost fully booked."}]}, "correctAnswer": "C"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Only kitchen staff who are 18 or older are allowed to use", "options": [{"label": "A", "text": "the waste disposal unit."}, {"label": "B", "text": "the electric mixer."}, {"label": "C", "text": "the meat slicer."}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the manager, which TWO things can make the job of kitchen assistant stressful? (Option 1)", "options": stress_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the manager, which TWO things can make the job of kitchen assistant stressful? (Option 2)", "options": stress_opts}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Joy Parkins", "options": resp_opts}, "correctAnswer": "F"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "David Field", "options": resp_opts}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Dexter Wills", "options": resp_opts}, "correctAnswer": "D"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Mike Smith", "options": resp_opts}, "correctAnswer": "B"},
    ]

    s3_content = """Questions 21–23
Choose the correct letter, A, B or C.

Paper on Public Libraries
21 What will be the main topic of Trudie and Stewart's paper?
A how public library services are organised in different countries
B how changes in society are reflected in public libraries
C how the funding of public libraries has changed

22 They agree that one disadvantage of free digitalised books is that
A they may take a long time to read.
B they can be difficult to read.
C they are generally old.

23 Stewart expects that in the future libraries will
A maintain their traditional function.
B become centres for local communities.
C no longer contain any books.

Questions 24–30
Complete the notes below.
Write ONE WORD ONLY for each answer.

Study of local library: possible questions
• whether it has a 24 ............... of its own
• its policy regarding noise of various kinds
• how it's affected by laws regarding all aspects of 25 ...............
• how the design needs to take the 26 ............... of customers into account
• what 27 ............... is required in case of accidents
• why a famous person's 28 ............... is located in the library
• whether it has a 29 ............... of local organisations
• how it's different from a library in a 30 ..............."""

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "What will be the main topic of Trudie and Stewart's paper?", "options": [{"label": "A", "text": "how public library services are organised in different countries"}, {"label": "B", "text": "how changes in society are reflected in public libraries"}, {"label": "C", "text": "how the funding of public libraries has changed"}]}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "They agree that one disadvantage of free digitalised books is that", "options": [{"label": "A", "text": "they may take a long time to read."}, {"label": "B", "text": "they can be difficult to read."}, {"label": "C", "text": "they are generally old."}]}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Stewart expects that in the future libraries will", "options": [{"label": "A", "text": "maintain their traditional function."}, {"label": "B", "text": "become centres for local communities."}, {"label": "C", "text": "no longer contain any books."}]}, "correctAnswer": "C"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "whether it has a ________ of its own", "blank": True}, "correctAnswer": "budget"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "how it's affected by laws regarding all aspects of ________", "blank": True}, "correctAnswer": "employment"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "how the design needs to take the ________ of customers into account", "blank": True}, "correctAnswer": "safety"},
        {"number": 27, "order": 26, "type": "GAP_FILL", "content": {"stem": "what ________ is required in case of accidents", "blank": True}, "correctAnswer": "insurance"},
        {"number": 28, "order": 27, "type": "GAP_FILL", "content": {"stem": "why a famous person's ________ is located in the library", "blank": True}, "correctAnswer": "diary"},
        {"number": 29, "order": 28, "type": "GAP_FILL", "content": {"stem": "whether it has a ________ of local organisations", "blank": True}, "correctAnswer": "database"},
        {"number": 30, "order": 29, "type": "GAP_FILL", "content": {"stem": "how it's different from a library in a ________", "blank": True}, "correctAnswer": "museum"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write NO MORE THAN TWO WORDS for each answer.

Four business values
Many business values can result in 31 ...............
Senior managers need to understand and deal with the potential 32 ............... that may result.

Collaboration
• During a training course, the speaker was in a team that had to build a 33 ...............
• Other teams experienced 34 ............... from trying to collaborate.
• The speaker's team won because they reduced collaboration.
• Sales of a 35 ............... were poor because of collaboration.

Industriousness
• Hard work may be a bad use of various company 36 ...............
• The word 'lazy' in this context refers to people who avoid doing tasks that are 37 ...............

Creativity
• An advertising campaign for a 38 ............... was memorable but failed to boost sales.
• Creativity should be used as a response to a particular 39 ...............

Excellence
• According to one study, on average, pioneers had a 40 ............... that was far higher than that of followers.
• Companies that always aim at excellence may miss opportunities."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "Many business values can result in ________", "blank": True}, "correctAnswer": "damage"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "Senior managers need to understand and deal with the potential ________ that may result.", "blank": True}, "correctAnswer": "side effects"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "During a training course, the speaker was in a team that had to build a ________", "blank": True}, "correctAnswer": "bridge"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "Other teams experienced ________ from trying to collaborate.", "blank": True}, "correctAnswer": "confusion"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Sales of a ________ were poor because of collaboration.", "blank": True}, "correctAnswer": "smartphone"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Hard work may be a bad use of various company ________", "blank": True}, "correctAnswer": "resources"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The word 'lazy' in this context refers to people who avoid doing tasks that are ________", "blank": True}, "correctAnswer": "unnecessary", "acceptableAnswers": ["unnecessary", "not necessary"]},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "An advertising campaign for a ________ was memorable but failed to boost sales.", "blank": True}, "correctAnswer": "chocolate bar"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Creativity should be used as a response to a particular ________", "blank": True}, "correctAnswer": "problem"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "According to one study, on average, pioneers had a ________ that was far higher than that of followers.", "blank": True}, "correctAnswer": "market share"},
    ]

    listening_draft = {
        "title": "Test 27.C12.01 - Listening",
        "slug": "test-27-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-27-section-1.mp3",
            "/uploads/audio/test-27-section-2.mp3",
            "/uploads/audio/test-27-section-3.mp3",
            "/uploads/audio/test-27-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-27-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-27-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-27-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-27-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

The story of cork

Cork — the thick bark of the cork oak tree (Quercus suber) — is a remarkable material. It is tough, elastic, buoyant, and fire-resistant, and suitable for a wide range of purposes. It has also been used for millennia: the ancient Egyptians sealed their sarcophagi (stone coffins) with cork, while the ancient Greeks and Romans used it for anything from beehives to sandals.

And the cork oak itself is an extraordinary tree. Its bark grows up to 20 cm in thickness, insulating the tree like a coat wrapped around the trunk and branches and keeping the inside at a constant 20°C all year round. Developed most probably as a defence against forest fires, the bark of the cork oak has a particular cellular structure — with about 40 million cells per cubic centimetre — that technology has never succeeded in replicating. The cells are filled with air, which is why cork is so buoyant. It also has an elasticity that means you can squash it and watch it spring back to its original size and shape when you release the pressure.

Cork oaks grow in a number of Mediterranean countries, including Portugal, Spain, Italy, Greece and Morocco. They flourish in warm, sunny climates where there is a minimum of 400 millimetres of rain per year, and not more than 800 millimetres. Like grape vines, the trees thrive in poor soil, putting down deep roots in search of moisture and nutrients. Southern Portugal's Alentejo region meets all of these requirements, which explains why, by the early 20th century, this region had become the world's largest producer of cork, and why today it accounts for roughly half of all cork production around the world.

Most cork forests are family-owned. Many of these family businesses, and indeed many of the trees themselves, are around 200 years old. Cork production is, above all, an exercise in patience. From the planting of a cork sapling to the first harvest takes 25 years, and a gap of approximately a decade must separate harvests from an individual tree. And for top-quality cork, it's necessary to wait a further 15 or 20 years. You even have to wait for the right kind of summer's day to harvest cork. If the bark is stripped on a day when it's too cold — or when the air is damp — the tree will be damaged.

Cork harvesting is a very specialised profession. No mechanical means of stripping cork bark has been invented, so the job is done by teams of highly skilled workers. First, they make vertical cuts down the bark using small sharp axes, then lever it away in pieces as large as they can manage. The most skilful cork-strippers prise away a semi-circular husk that runs the length of the trunk from just above ground level to the first branches. It is then dried on the ground for about four months, before being taken to factories, where it is boiled to kill any insects that might remain in the cork. Over 60% of cork then goes on to be made into traditional bottle stoppers, with most of the remainder being used in the construction trade. Corkboard and cork tiles are ideal for thermal and acoustic insulation, while granules of cork are used in the manufacture of concrete.

Recent years have seen the end of the virtual monopoly of cork as the material for bottle stoppers, due to concerns about the effect it may have on the contents of the bottle. This is caused by a chemical compound called 2,4,6-trichloroanisole (TCA), which forms through the interaction of plant phenols, chlorine and mould. The tiniest concentrations — as little as three or four parts to a trillion — can spoil the taste of the product contained in the bottle. The result has been a gradual yet steady move first towards plastic stoppers and, more recently, to aluminium screw caps. These substitutes are cheaper to manufacture and, in the case of screw caps, more convenient for the user.

The classic cork stopper does have several advantages, however. Firstly, its traditional image is more in keeping with that of the type of high quality goods with which it has long been associated. Secondly — and very importantly — cork is a sustainable product that can be recycled without difficulty. Moreover, cork forests are a resource which support local biodiversity, and prevent desertification in the regions where they are planted. So, given the current concerns about environmental issues, the future of this ancient material once again looks promising.

Questions 1–5
Do the following statements agree with the information given in Reading Passage 1?
In boxes 1–5 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

1 The cork oak has the thickest bark of any living tree.
2 Scientists have developed a synthetic cork with the same cellular structure as natural cork.
3 Individual cork oak trees must be left for 25 years between the first and second harvest.
4 Cork bark should be stripped in dry atmospheric conditions.
5 The only way to remove the bark from cork oak trees is by hand.

Questions 6–13
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 6–13 on your answer sheet.

Comparison of aluminium screw caps and cork bottle stoppers
Advantages of aluminium screw caps
• do not affect the 6 ............... of the bottle contents
• are 7 ............... to produce
• are 8 ............... to use

Advantages of cork bottle stoppers
• suit the 9 ............... of quality products
• made from a 10 ............... material
• easily 11 ...............
• cork forests aid 12 ...............
• cork forests stop 13 ............... happening"""

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "TRUE_FALSE_NG", "content": {"stem": "The cork oak has the thickest bark of any living tree.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 2, "order": 1, "type": "TRUE_FALSE_NG", "content": {"stem": "Scientists have developed a synthetic cork with the same cellular structure as natural cork.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 3, "order": 2, "type": "TRUE_FALSE_NG", "content": {"stem": "Individual cork oak trees must be left for 25 years between the first and second harvest.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 4, "order": 3, "type": "TRUE_FALSE_NG", "content": {"stem": "Cork bark should be stripped in dry atmospheric conditions.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 5, "order": 4, "type": "TRUE_FALSE_NG", "content": {"stem": "The only way to remove the bark from cork oak trees is by hand.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "do not affect the ________ of the bottle contents", "blank": True}, "correctAnswer": "taste"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "are ________ to produce", "blank": True}, "correctAnswer": "cheaper"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "are ________ to use", "blank": True}, "correctAnswer": "convenient"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "suit the ________ of quality products", "blank": True}, "correctAnswer": "image"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "made from a ________ material", "blank": True}, "correctAnswer": "sustainable"},
        {"number": 11, "order": 10, "type": "GAP_FILL", "content": {"stem": "easily ________", "blank": True}, "correctAnswer": "recycled"},
        {"number": 12, "order": 11, "type": "GAP_FILL", "content": {"stem": "cork forests aid ________", "blank": True}, "correctAnswer": "biodiversity"},
        {"number": 13, "order": 12, "type": "GAP_FILL", "content": {"stem": "cork forests stop ________ happening", "blank": True}, "correctAnswer": "desertification"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

COLLECTING AS A HOBBY

Collecting must be one of the most varied of human activities, and it's one that many of us psychologists find fascinating. Many forms of collecting have been dignified with a technical name: an arctophilist collects teddy bears, a philatelist collects postage stamps, and a deltiologist collects postcards. Amassing hundreds or even thousands of postcards, chocolate wrappers or whatever, takes time, energy and money that could surely be put to much more productive use. And yet there are millions of collectors around the world. Why do they do it?

There are the people who collect because they want to make money — this could be called an instrumental reason for collecting; that is, collecting as a means to an end. They'll look for, say, antiques that they can buy cheaply and expect to be able to sell at a profit. But there may well be a psychological element, too — buying cheap and selling dear can give the collector a sense of triumph. And as selling online is so easy, more and more people are joining in.

Many collectors collect to develop their social life, attending meetings of a group of collectors and exchanging information on items. This is a variant on joining a bridge club or a gym, and similarly brings them into contact with like-minded people.

Another motive for collecting is the desire to find something special, or a particular example of the collected item, such as a rare early recording by a particular singer. Some may spend their whole lives in a hunt for this. Psychologically, this can give a purpose to a life that otherwise feels aimless. There is a danger, though, that if the individual is ever lucky enough to find what they're looking for, rather than celebrating their success, they may feel empty, now that the goal that drove them on has gone.

If you think about collecting postage stamps, another potential reason for it — or, perhaps, a result of collecting — is its educational value. Stamp collecting opens a window to other countries, and to the plants, animals, or famous people shown on their stamps. Similarly, in the 19th century, many collectors amassed fossils, animals and plants from around the globe, and their collections provided a vast amount of information about the natural world. Without those collections, our understanding would be greatly inferior to what it is.

In the past — and nowadays, too, though to a lesser extent — a popular form of collecting, particularly among boys and men, was trainspotting. This might involve trying to see every locomotive of a particular type, using published data that identifies each one, and ticking off each engine as it is seen. Trainspotters exchange information, these days often by mobile phone, so they can work out where to go to, to see a particular engine. As a by-product, many practitioners of the hobby become very knowledgeable about railway operations, or the technical specifications of different engine types.

Similarly, people who collect dolls may go beyond simply enlarging their collection, and develop an interest in the way that dolls are made, or the materials that are used. These have changed over the centuries from the wood that was standard in 16th century Europe, through the wax and porcelain of later centuries, to the plastics of today's dolls. Or collectors might be inspired to study how dolls reflect notions of what children like, or ought to like.

Not all collectors are interested in learning from their hobby, though, so what we might call a psychological reason for collecting is the need for a sense of control, perhaps as a way of dealing with insecurity. Stamp collectors, for instance, arrange their stamps in albums, usually very neatly organising their collection according to certain commonplace principles — perhaps by country in alphabetical order, or grouping stamps by what they depict — people, birds, maps, and so on.

One reason, conscious or not, for what someone chooses to collect is to show the collector's individualism. Someone who decides to collect something as unexpected as dog collars, for instance, may be conveying their belief that they must be interesting themselves. And believe it or not, there is at least one dog collar museum in existence, and it grew out of a personal collection.

Of course, all hobbies give pleasure, but the common factor in collecting is usually passion: pleasure is putting it far too mildly. More than most other hobbies, collecting can be totally engrossing, and can give a strong sense of personal fulfilment. To non-collectors it may appear an eccentric, if harmless, way of spending time, but potentially, collecting has a lot going for it.

Questions 14–21
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 14–21 on your answer sheet.

14 The writer mentions collecting ............. as an example of collecting in order to make money.
15 Collectors may get a feeling of ............. from buying and selling items.
16 Collectors' clubs provide opportunities to share ............. .
17 Collectors' clubs offer ............. with people who have similar interests.
18 Collecting sometimes involves a life-long ............. for a special item.
19 Searching for something particular may prevent people from feeling their life is completely ............. .
20 Stamp collecting may be ............. because it provides facts about different countries.
21 ............. tends to be mostly a male hobby.

Questions 22–26
Do the following statements agree with the information given in Reading Passage 2?
In boxes 22–26 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

22 The number of people buying dolls has grown over the centuries.
23 Sixteenth century European dolls were normally made of wax and porcelain.
24 Arranging a stamp collection by the size of the stamps is less common than other methods.
25 Someone who collects unusual objects may want others to think he or she is also unusual.
26 Collecting gives a feeling that other hobbies are unlikely to inspire."""

    p2_questions = [
        {"number": 14, "order": 13, "type": "GAP_FILL", "content": {"stem": "The writer mentions collecting ________ as an example of collecting in order to make money.", "blank": True}, "correctAnswer": "antiques"},
        {"number": 15, "order": 14, "type": "GAP_FILL", "content": {"stem": "Collectors may get a feeling of ________ from buying and selling items.", "blank": True}, "correctAnswer": "triumph"},
        {"number": 16, "order": 15, "type": "GAP_FILL", "content": {"stem": "Collectors' clubs provide opportunities to share ________ .", "blank": True}, "correctAnswer": "information"},
        {"number": 17, "order": 16, "type": "GAP_FILL", "content": {"stem": "Collectors' clubs offer ________ with people who have similar interests.", "blank": True}, "correctAnswer": "contact", "acceptableAnswers": ["contact", "meetings"]},
        {"number": 18, "order": 17, "type": "GAP_FILL", "content": {"stem": "Collecting sometimes involves a life-long ________ for a special item.", "blank": True}, "correctAnswer": "hunt", "acceptableAnswers": ["hunt", "desire"]},
        {"number": 19, "order": 18, "type": "GAP_FILL", "content": {"stem": "Searching for something particular may prevent people from feeling their life is completely ________ .", "blank": True}, "correctAnswer": "aimless", "acceptableAnswers": ["aimless", "empty"]},
        {"number": 20, "order": 19, "type": "GAP_FILL", "content": {"stem": "Stamp collecting may be ________ because it provides facts about different countries.", "blank": True}, "correctAnswer": "educational"},
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "________ tends to be mostly a male hobby.", "blank": True}, "correctAnswer": "trainspotting", "acceptableAnswers": ["trainspotting", "Trainspotting"]},
        {"number": 22, "order": 21, "type": "TRUE_FALSE_NG", "content": {"stem": "The number of people buying dolls has grown over the centuries.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "Sixteenth century European dolls were normally made of wax and porcelain.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "Arranging a stamp collection by the size of the stamps is less common than other methods.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 25, "order": 24, "type": "TRUE_FALSE_NG", "content": {"stem": "Someone who collects unusual objects may want others to think he or she is also unusual.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 26, "order": 25, "type": "TRUE_FALSE_NG", "content": {"stem": "Collecting gives a feeling that other hobbies are unlikely to inspire.", "options": tfng_opts}, "correctAnswer": "TRUE"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

What's the purpose of gaining knowledge?

Section A
'I would found an institution where any person can find instruction in any study.' This was the founder's motto for Cornell University, and it seems an apt characterization of the different university, also in the USA, where I currently teach philosophy. A student can prepare for a career in resort management, engineering, interior design, accounting, music, law enforcement, you name it. But would founders of these two institutions have thought of a course called 'Arson for Profit'? I doubt it. More to the point, should a course that bears this title be taught in the university?

Section B
'Arson for Profit' is a specialization of the degree in fire science, which is a program for students who wish to pursue a career in the fire service or related areas. It is principally designed for prospective arson investigators, who can learn all the tricks of the trade for detecting whether a fire was deliberately set, discovering who did it, and establishing a chain of evidence for effective prosecution in a court of law. But wouldn't this also be the perfect course for prospective arsonists to sign up for? My point is not to criticize academic programs in fire science: they are highly welcome as part of the increasing professionalization of this and many other occupations. However, it's not unknown for a firefighter to torch a building. This example suggests how dishonest and illegal behavior, with the help of higher education, can creep into every aspect of public and business life.

Section C
I realized this anew when I was invited to speak before a class in marketing, which is another of our degree programs. The regular instructor is a colleague who appreciates the kind of ethical perspective I can bring as a philosopher. There are endless ways I could have approached this assignment, but I took my cue from the title of the course: 'Principles of Marketing'. It made me think to ask the students, 'Is marketing principled?' After all, a subject matter can have principles in the sense of being codified, having rules, as with football or chess, without being principled in the sense of being ethical. Many of the students immediately assumed that the answer to my question about marketing principles was obvious: no. Just look at the ways in which everything under the sun has been marketed; obviously it need not be done in a principled (=ethical) fashion. Is that obvious? I made the suggestion, which may sound downright crazy in light of the evidence, that perhaps marketing is by definition principled. My inspiration for this judgement is the philosopher Immanuel Kant, who argued that any body of knowledge consists of an end (or purpose) and a means.

Section D
Let us apply both the terms 'means' and 'end' to marketing. The students have signed up for a course in order to learn how to market effectively. But to what end? There seem to be two main attitudes toward that question. One is that the answer is obvious: the purpose of marketing is to sell things and to make money. The other attitude is that the purpose of marketing is irrelevant: Each person comes to the program and course with his or her own plans, and these need not even concern the acquisition of marketing expertise as such. My proposal, which I believe would also be Kant's, is that neither of these attitudes captures the significance of the end to the means for marketing. A field of knowledge or a professional endeavor is defined by both the means and the end; hence both deserve scrutiny. Students need to study both how to achieve X, and also what X is.

Section E
It is at this point that 'Arson for Profit' becomes supremely relevant. That course is presumably all about means: how to detect and prosecute criminal activity. It is therefore assumed that the end is good in an ethical sense. When I ask fire science students to articulate the end, or purpose, of their field, they eventually generalize to something like, 'The safety and welfare of society,' which seems right. As we have seen, someone could use the very same knowledge of means to achieve a much less noble end, such as personal profit via destructive, dangerous, reckless activity. But we would not call that firefighting. We have a separate word for it: arson. Similarly, if you employed the 'principles of marketing' in an unprincipled way, you would not be doing marketing. We have another term for it: fraud. Kant gives the example of a doctor and a poisoner, who use the identical knowledge to achieve their divergent ends. We would say that one is practicing medicine, the other, murder.

Section F
We have terms of praise and terms of blame for divergent ends that are achieved with the same knowledge. In marketing, if someone sells a product that solves a genuine problem or brings real pleasure to consumers, we might say that they are doing good business. But if someone deliberately misleads consumers, using deceitful packaging or false claims in order to make money, we say they are ripping people off. To see marketing as by definition principled means recognizing that the discipline has a built-in purpose — to connect buyers and sellers in mutually beneficial exchanges. The study of marketing must therefore examine this purpose, rather than just teaching techniques to achieve whatever ends a person might have.

Questions 27–32
Reading Passage 3 has six sections, A–F.
Choose the correct heading for each section from the list of headings below.
Write the correct number, i–viii, in boxes 27–32 on your answer sheet.

List of Headings
i Courses that require a high level of commitment
ii A course title with two meanings
iii The equal importance of two key issues
iv Applying a theory in an unexpected context
v The financial benefits of studying
vi A surprising course title
vii Different names for different outcomes
viii The possibility of attracting the wrong kind of student

27 Section A
28 Section B
29 Section C
30 Section D
31 Section E
32 Section F

Questions 33–36
Complete the summary below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
Write your answers in boxes 33–36 on your answer sheet.

The 'Arson for Profit' course
This is a university course intended for students who are undergraduates and who are studying 33 ............. . The expectation is that they will become 34 ............. specialising in arson. The course will help them to detect cases of arson and find 35 ............. of criminal intent, leading to successful 36 ............. in the courts.

Questions 37–40
Do the following statements agree with the views of the writer in Reading Passage 3?
In boxes 37–40 on your answer sheet, write
YES if the statement agrees with the views of the writer
NO if the statement contradicts the views of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

37 It is difficult to attract students onto courses that do not focus on a career.
38 The 'Arson for Profit' course would be useful for people intending to set fire to buildings.
39 Fire science courses are too academic to help people to be good at the job of firefighting.
40 The writer's fire science students provided a detailed definition of the purpose of their studies."""

    headings_opts = [
        {"label": "i", "text": "Courses that require a high level of commitment"},
        {"label": "ii", "text": "A course title with two meanings"},
        {"label": "iii", "text": "The equal importance of two key issues"},
        {"label": "iv", "text": "Applying a theory in an unexpected context"},
        {"label": "v", "text": "The financial benefits of studying"},
        {"label": "vi", "text": "A surprising course title"},
        {"label": "vii", "text": "Different names for different outcomes"},
        {"label": "viii", "text": "The possibility of attracting the wrong kind of student"},
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Section A", "options": headings_opts}, "correctAnswer": "vi"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Section B", "options": headings_opts}, "correctAnswer": "viii"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Section C", "options": headings_opts}, "correctAnswer": "ii"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Section D", "options": headings_opts}, "correctAnswer": "iv"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Section E", "options": headings_opts}, "correctAnswer": "iii"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "Section F", "options": headings_opts}, "correctAnswer": "vii"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "This is a university course intended for students who are undergraduates and who are studying ________ .", "blank": True}, "correctAnswer": "fire science"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "The expectation is that they will become ________ specialising in arson.", "blank": True}, "correctAnswer": "investigators"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "The course will help them to detect cases of arson and find ________ of criminal intent,", "blank": True}, "correctAnswer": "evidence"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "leading to successful ________ in the courts.", "blank": True}, "correctAnswer": "prosecution", "acceptableAnswers": ["prosecution", "prosecutions"]},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "It is difficult to attract students onto courses that do not focus on a career.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "The 'Arson for Profit' course would be useful for people intending to set fire to buildings.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "Fire science courses are too academic to help people to be good at the job of firefighting.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "The writer's fire science students provided a detailed definition of the purpose of their studies.", "options": ynng_opts}, "correctAnswer": "NO"},
    ]

    reading_draft = {
        "title": "Test 27.C12.01 - Reading",
        "slug": "test-27-reading",
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
