# Test 33: Cambridge 18 Test 3 (Test 33.C18.03)
import json
import os

def get_test_33():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–4
Complete the form below.
Write ONE WORD AND/OR A NUMBER for each answer.

Wayside Camera Club membership form
Name: Dan Green
Email address: dan1068@market.com
Home address: 52 1 ............... Street, Peacetown
Heard about us: from a 2 ...............
Reasons for joining:
- to enter competitions
- to 3 ...............
Type of membership: 4 ............... membership (£30)

Questions 5–10
Complete the table below.
Write NO MORE THAN TWO WORDS for each answer.

| Title of competition | Instructions | Feedback to Dan |
| --- | --- | --- |
| '5 ...............' | A scene in the home | The picture's composition was not good. |
| 'Beautiful Sunsets' | Scene must show some 6 ............... | The 7 ............... was wrong. |
| '8 ...............' | Scene must show 9 ............... | The photograph was too 10 ............... . |"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Home address: 52 1 ________ Street, Peacetown", "blank": True}, "correctAnswer": "Marrowfield"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Heard about us: from a 2 ________", "blank": True}, "correctAnswer": "relative"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Reasons for joining: to enter competitions, to 3 ________", "blank": True}, "correctAnswer": "socialise", "acceptableAnswers": ["socialise", "socialize"]},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Type of membership: 4 ________ membership (£30)", "blank": True}, "correctAnswer": "full"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Title of competition: '5 ________'", "blank": True}, "correctAnswer": "Domestic Life"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Scene must show some 6 ________", "blank": True}, "correctAnswer": "clouds"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "The 7 ________ was wrong.", "blank": True}, "correctAnswer": "timing"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Title of competition: '8 ________'", "blank": True}, "correctAnswer": "Animal Magic"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Scene must show 9 ________", "blank": True}, "correctAnswer": "(animal) movement", "acceptableAnswers": ["movement", "animal movement"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "The photograph was too 10 ________ .", "blank": True}, "correctAnswer": "dark"},
    ]

    s2_content = """Questions 11 and 12
Choose TWO letters, A–E.
Which TWO warnings does Dan give about picking mushrooms?
A Don't pick more than one variety of mushroom at a time.
B Don't pick mushrooms near busy roads.
C Don't eat mushrooms given to you.
D Don't eat mushrooms while picking them.
E Don't pick old mushrooms.

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO ideas about wild mushrooms does Dan say are correct?
A Mushrooms should always be peeled before eating.
B Mushrooms eaten by animals may be unsafe.
C Cooking destroys toxins in mushrooms.
D Brightly coloured mushrooms can be edible.
E All poisonous mushrooms have a bad smell.

Questions 15–20
Choose the correct letter, A, B or C.

15 What advice does Dan give about picking mushrooms in parks?
A Choose wooded areas.
B Don't disturb wildlife.
C Get there early.

16 Dan says it is a good idea for beginners to
A use a mushroom app.
B join a group.
C take a reference book.

17 What does Dan say is important for conservation?
A selecting only fully grown mushrooms
B picking a limited amount of mushrooms
C avoiding areas where rare mushroom species grow

18 According to Dan, some varieties of wild mushrooms are in decline because there is
A a huge demand for them from restaurants.
B a lack of rain in this part of the country.
C a rise in building developments locally.

19 Dan says that when storing mushrooms, people should
A keep them in the fridge for no more than two days.
B keep them in a brown bag in a dark room.
C leave them for a period after washing them.

20 What does Dan say about trying new varieties of mushrooms?
A Experiment with different recipes.
B Expect some to have a strong taste.
C Cook them for a long time."""

    warnings_opts = [
        {"label": "A", "text": "Don't pick more than one variety of mushroom at a time."},
        {"label": "B", "text": "Don't pick mushrooms near busy roads."},
        {"label": "C", "text": "Don't eat mushrooms given to you."},
        {"label": "D", "text": "Don't eat mushrooms while picking them."},
        {"label": "E", "text": "Don't pick old mushrooms."},
    ]

    ideas_opts = [
        {"label": "A", "text": "Mushrooms should always be peeled before eating."},
        {"label": "B", "text": "Mushrooms eaten by animals may be unsafe."},
        {"label": "C", "text": "Cooking destroys toxins in mushrooms."},
        {"label": "D", "text": "Brightly coloured mushrooms can be edible."},
        {"label": "E", "text": "All poisonous mushrooms have a bad smell."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO warnings does Dan give about picking mushrooms? (Option 1)", "options": warnings_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO warnings does Dan give about picking mushrooms? (Option 2)", "options": warnings_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO ideas about wild mushrooms does Dan say are correct? (Option 1)", "options": ideas_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO ideas about wild mushrooms does Dan say are correct? (Option 2)", "options": ideas_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What advice does Dan give about picking mushrooms in parks?", "options": [{"label": "A", "text": "Choose wooded areas."}, {"label": "B", "text": "Don't disturb wildlife."}, {"label": "C", "text": "Get there early."}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "Dan says it is a good idea for beginners to", "options": [{"label": "A", "text": "use a mushroom app."}, {"label": "B", "text": "join a group."}, {"label": "C", "text": "take a reference book."}]}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Dan say is important for conservation?", "options": [{"label": "A", "text": "selecting only fully grown mushrooms."}, {"label": "B", "text": "picking a limited amount of mushrooms."}, {"label": "C", "text": "avoiding areas where rare mushroom species grow."}]}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to Dan, some varieties of wild mushrooms are in decline because there is", "options": [{"label": "A", "text": "a huge demand for them from restaurants."}, {"label": "B", "text": "a lack of rain in this part of the country."}, {"label": "C", "text": "a rise in building developments locally."}]}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Dan says that when storing mushrooms, people should", "options": [{"label": "A", "text": "keep them in the fridge for no more than two days."}, {"label": "B", "text": "keep them in a brown bag in a dark room."}, {"label": "C", "text": "leave them for a period after washing them."}]}, "correctAnswer": "A"},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Dan say about trying new varieties of mushrooms?", "options": [{"label": "A", "text": "Experiment with different recipes."}, {"label": "B", "text": "Expect some to have a strong taste."}, {"label": "C", "text": "Cook them for a long time."}]}, "correctAnswer": "A"},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO opinions about the Luddites do the students express?
A Their actions were ineffective.
B They are still influential today.
C They have received unfair criticism.
D They were proved right.
E Their attitude is understandable.

Questions 23 and 24
Choose TWO letters, A–E.
Which TWO predictions about the future of work are the students doubtful about?
A Work will be more rewarding.
B Unemployment will fall.
C People will want to delay retiring.
D Working hours will be shorter.
E People will change jobs more frequently.

Questions 25–30
What comment do the students make about each of the following jobs?
Choose SIX answers from the box and write the correct letter, A–G, next to Questions 25–30.

Comments
A These jobs are likely to be at risk.
B Their role has become more interesting in recent years.
C The number of people working in this sector has fallen dramatically.
D This job will require more qualifications.
E Higher disposable income has led to a huge increase in jobs.
F There is likely to be a significant rise in demand for this service.
G Both employment and productivity have risen.

Jobs
25 Accountants
26 Hairdressers
27 Administrative staff
28 Agricultural workers
29 Care workers
30 Bank clerks"""

    luddites_opts = [
        {"label": "A", "text": "Their actions were ineffective."},
        {"label": "B", "text": "They are still influential today."},
        {"label": "C", "text": "They have received unfair criticism."},
        {"label": "D", "text": "They were proved right."},
        {"label": "E", "text": "Their attitude is understandable."},
    ]

    predictions_opts = [
        {"label": "A", "text": "Work will be more rewarding."},
        {"label": "B", "text": "Unemployment will fall."},
        {"label": "C", "text": "People will want to delay retiring."},
        {"label": "D", "text": "Working hours will be shorter."},
        {"label": "E", "text": "People will change jobs more frequently."},
    ]

    job_comment_opts = [
        {"label": "A", "text": "These jobs are likely to be at risk."},
        {"label": "B", "text": "Their role has become more interesting in recent years."},
        {"label": "C", "text": "The number of people working in this sector has fallen dramatically."},
        {"label": "D", "text": "This job will require more qualifications."},
        {"label": "E", "text": "Higher disposable income has led to a huge increase in jobs."},
        {"label": "F", "text": "There is likely to be a significant rise in demand for this service."},
        {"label": "G", "text": "Both employment and productivity have risen."},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO opinions about the Luddites do the students express? (Option 1)", "options": luddites_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "E"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO opinions about the Luddites do the students express? (Option 2)", "options": luddites_opts}, "correctAnswer": "E", "acceptableAnswers": ["A", "E"]},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO predictions about the future of work are the students doubtful about? (Option 1)", "options": predictions_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO predictions about the future of work are the students doubtful about? (Option 2)", "options": predictions_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Accountants", "options": job_comment_opts}, "correctAnswer": "G"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Hairdressers", "options": job_comment_opts}, "correctAnswer": "E"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Administrative staff", "options": job_comment_opts}, "correctAnswer": "B"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Agricultural workers", "options": job_comment_opts}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Care workers", "options": job_comment_opts}, "correctAnswer": "F"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Bank clerks", "options": job_comment_opts}, "correctAnswer": "A"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Space Traffic Management
A Space Traffic Management system
• is a concept similar to Air Traffic Control, but for satellites rather than planes.
• would aim to set up legal and 31 ............... ways of improving safety.
• does not actually exist at present.

Problems in developing effective Space Traffic Management
• Satellites are now quite 32 ............... and therefore more widespread (e.g. there are constellations made up of 33 ............... of satellites).
• At present, satellites are not required to transmit information to help with their 34 ............... .
• There are few systems for 35 ............... satellites.
• Small pieces of debris may be difficult to identify.
• Operators may be unwilling to share details of satellites used for 36 ............... or commercial reasons.
• It may be hard to collect details of the object's 37 ............... at a given time.
• Scientists can only make a 38 ............... about where the satellite will go.

Solutions
• Common standards should be agreed on for the presentation of information.
• The information should be combined in one 39 ............... .
• A coordinated system must be designed to create 40 ............... in its users."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "would aim to set up legal and 31 ________ ways of improving safety.", "blank": True}, "correctAnswer": "technical"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "Satellites are now quite 32 ________ and therefore more widespread", "blank": True}, "correctAnswer": "cheap"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "(e.g. there are constellations made up of 33 ________ of satellites).", "blank": True}, "correctAnswer": "thousands"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "At present, satellites are not required to transmit information to help with their 34 ________ .", "blank": True}, "correctAnswer": "identification"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "There are few systems for 35 ________ satellites.", "blank": True}, "correctAnswer": "tracking"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Operators may be unwilling to share details of satellites used for 36 ________ or commercial reasons.", "blank": True}, "correctAnswer": "military"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "It may be hard to collect details of the object's 37 ________ at a given time.", "blank": True}, "correctAnswer": "location"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Scientists can only make a 38 ________ about where the satellite will go.", "blank": True}, "correctAnswer": "prediction"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "The information should be combined in one 39 ________ .", "blank": True}, "correctAnswer": "database"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "A coordinated system must be designed to create 40 ________ in its users.", "blank": True}, "correctAnswer": "trust"},
    ]

    t33_listening = {
        "title": "Test 33.C18.03 - Listening",
        "slug": "test-33-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-33-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-33-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-33-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-33-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_text = """Materials to take us beyond concrete

Concrete is everywhere, but it's bad for the planet, generating large amounts of carbon dioxide – alternatives are being developed

A Concrete is the second most used substance in the global economy, after water – and one of the world's biggest single sources of greenhouse gas emissions. The chemical process by which cement, the key ingredient of concrete, is created results in large quantities of carbon dioxide. The UN estimates that there will be 9.8 billion people living on the planet by mid-century. They will need somewhere to live. If concrete is the only answer to the construction of new cities, then carbon emissions will soar, aggravating global warming. And so scientists have started innovating with other materials, in a scramble for alternatives to a universal commodity that has underpinned our modern life for many years.

B The problem with replacing concrete is that it is so very good at what it does. Chris Cheeseman, an engineering professor at Imperial College London, says the key thing to consider is the extent to which concrete is used around the world, and is likely to continue to be used. 'Concrete is not a high-carbon product. Cement is high carbon, but concrete is not. But it is the scale on which it is used that makes it high carbon. The sheer scale of manufacture is so huge, that is the issue.'

C Not only are the ingredients of concrete relatively cheap and found in abundance in most places around the globe, the stuff itself has marvellous properties: Portland cement, the vital component of concrete, is mouldable and pourable, but quickly sets hard. Cheeseman also notes another advantage: concrete and steel have similar thermal expansion properties, so steel can be used to reinforce concrete, making it far stronger and more flexible as a building material than it could be on its own. According to Cheeseman, all these factors together make concrete hard to beat. 'Concrete is amazing stuff. Making anything with similar properties is going to be very difficult.'

D A possible alternative to concrete is wood. Making buildings from wood may seem like a rather medieval idea, but climate change is driving architects to turn to treated timber as a possible resource. Recent years have seen the emergence of tall buildings constructed almost entirely from timber. Vancouver, Vienna and Brumunddal in Norway are all home to constructed tall, wooden buildings.

E Using wood to construct buildings, however, is not straightforward. Wood expands as it absorbs moisture from the air and is susceptible to pests, not to mention fire. But treating wood and combining it with other materials can improve its properties. Cross-laminated timber is engineered wood. An adhesive is used to stick layers of solid-sawn timber together, crosswise, to form building blocks. This material is light but has the strength of concrete and steel. Construction experts say that wooden buildings can be constructed at a greater speed than ones of concrete and steel and the process, it seems, is quieter.

F Stora Enso is Europe's biggest supplier of cross-laminated timber, and its vice-president Markus Mannström reports that the company is seeing increasing demand globally for building in wood, with climate change concerns the key driver. Finland, with its large forests, where Stora Enso is based, has been leading the way, but the company is seeing a rise in demand for its timber products across the world, including in Asia. Of course, using timber in a building also locks away the carbon that it absorbed as it grew. But even treated wood has its limitations and only when a wider range of construction projects has been proven in practice will it be possible to see wood as a real alternative to concrete in constructing tall buildings.

G Fly ash and slag from iron ore are possible alternatives to cement in a concrete mix. Fly ash, a byproduct of coal-burning power plants, can be incorporated into concrete mixes to make up as much as 15 to 30% of the cement, without harming the strength or durability of the resulting mix. Iron-ore slag, a byproduct of the iron-ore smelting process, can be used in a similar way. Their incorporation into concrete mixes has the potential to reduce greenhouse gas emissions.
But Anna Surgenor, of the UK's Green Building Council, notes that although these waste products can save carbon in the concrete mix, their use is not always straightforward. 'It's possible to replace the cement content in concrete with waste products to lower the overall carbon impact. But there are several calculations that need to be considered across the entire life cycle of the building – these include factoring in where these materials are being shipped from. If they are transported over long distances, using fossil fuels, the use of alternative materials might not make sense from an overall carbon reduction perspective.'

H While these technologies are all promising ideas, they are either unproven or based on materials that are not abundant. In their overview of innovation in the concrete industry, Felix Preston and Johanna Lehne of the UK's Royal Institute of International Affairs reached the conclusion that, 'Some novel cements have been discussed for more than a decade within the research community, without breaking through. At present, these alternatives are rarely as cost-effective as conventional cement, and they face raw-material shortages and resistance from customers.'"""

    p1_q_content = """Questions 1–4
Reading Passage 1 has eight sections, A–H.
Which section contains the following information?
Write the correct letter, A–H, in boxes 1–4 on your answer sheet.

1 an explanation of the industrial processes that create potential raw materials for concrete
2 a reference to the various locations where high-rise wooden buildings can be found
3 an indication of how widely available the raw materials of concrete are
4 the belief that more high-rise wooden buildings are needed before wood can be regarded as a viable construction material

Questions 5–8
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 5–8 on your answer sheet.

Making buildings with wood
Wood is a traditional building material, but current environmental concerns are encouraging 5 ............... to use wood in modern construction projects. Using wood, however, has its challenges. For example, as 6 ............... in the atmosphere enters wood, it increases in size. In addition, wood is prone to pests and the risk of fire is greater. However, wood can be turned into a better construction material if it is treated and combined with other materials. In one process, 7 ............... of solid wood are glued together to create building blocks. These blocks are lighter than concrete and steel but equal them in strength. Experts say that wooden buildings are an improvement on those made of concrete and steel in terms of the 8 ............... with which they can be constructed and how much noise is generated by the process.

Questions 9–13
Look at the following statements (Questions 9–13) and the list of people below.
Match each statement with the correct person, A, B, C or D.
Write the correct letter, A, B, C or D, in boxes 9–13 on your answer sheet.
NB You may use any letter more than once.

List of People
A Chris Cheeseman
B Markus Mannström
C Anna Surgenor
D Felix Preston and Johanna Lehne

9 The environmental advantage of cement alternatives may not be as great as initially assumed.
10 It would be hard to create a construction alternative to concrete that offers so many comparable benefits.
11 Worries about the environment have led to increased interest in wood as a construction material.
12 Expense has been a factor in the negative response to the development of new cements.
13 The environmental damage caused by concrete is due to it being produced in large quantities."""

    people_concrete_opts = [
        {"label": "A", "text": "Chris Cheeseman"},
        {"label": "B", "text": "Markus Mannström"},
        {"label": "C", "text": "Anna Surgenor"},
        {"label": "D", "text": "Felix Preston and Johanna Lehne"},
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "MATCHING", "content": {"stem": "an explanation of the industrial processes that create potential raw materials for concrete", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}, {"label": "G", "text": "Section G"}, {"label": "H", "text": "Section H"}]}, "correctAnswer": "G"},
        {"number": 2, "order": 1, "type": "MATCHING", "content": {"stem": "a reference to the various locations where high-rise wooden buildings can be found", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}, {"label": "G", "text": "Section G"}, {"label": "H", "text": "Section H"}]}, "correctAnswer": "D"},
        {"number": 3, "order": 2, "type": "MATCHING", "content": {"stem": "an indication of how widely available the raw materials of concrete are", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}, {"label": "G", "text": "Section G"}, {"label": "H", "text": "Section H"}]}, "correctAnswer": "C"},
        {"number": 4, "order": 3, "type": "MATCHING", "content": {"stem": "the belief that more high-rise wooden buildings are needed before wood can be regarded as a viable construction material", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}, {"label": "G", "text": "Section G"}, {"label": "H", "text": "Section H"}]}, "correctAnswer": "F"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "current environmental concerns are encouraging 5 ________ to use wood in modern construction projects.", "blank": True}, "correctAnswer": "architects"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "For example, as 6 ________ in the atmosphere enters wood, it increases in size.", "blank": True}, "correctAnswer": "moisture"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "In one process, 7 ________ of solid wood are glued together to create building blocks.", "blank": True}, "correctAnswer": "layers"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "wooden buildings are an improvement on those made of concrete and steel in terms of the 8 ________ with which they can be constructed", "blank": True}, "correctAnswer": "speed"},
        {"number": 9, "order": 8, "type": "MATCHING", "content": {"stem": "The environmental advantage of cement alternatives may not be as great as initially assumed.", "options": people_concrete_opts}, "correctAnswer": "C"},
        {"number": 10, "order": 9, "type": "MATCHING", "content": {"stem": "It would be hard to create a construction alternative to concrete that offers so many comparable benefits.", "options": people_concrete_opts}, "correctAnswer": "A"},
        {"number": 11, "order": 10, "type": "MATCHING", "content": {"stem": "Worries about the environment have led to increased interest in wood as a construction material.", "options": people_concrete_opts}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MATCHING", "content": {"stem": "Expense has been a factor in the negative response to the development of new cements.", "options": people_concrete_opts}, "correctAnswer": "D"},
        {"number": 13, "order": 12, "type": "MATCHING", "content": {"stem": "The environmental damage caused by concrete is due to it being produced in large quantities.", "options": people_concrete_opts}, "correctAnswer": "A"},
    ]

    p2_text = """The steam car

The successes and failures of the Doble brothers and their steam cars

A When primitive automobiles first began to appear in the 1800s, their engines were based on steam power. Steam had already enjoyed a long and successful career in the railways, so it was only natural that the technology evolved into a miniaturized version which was separate from the trains. But these early cars inherited steam's weaknesses along with its strengths. The boilers had to be lit by hand, and they required about twenty minutes to build up pressure before they could be driven. Furthermore, their water reservoirs only lasted for about thirty miles before needing replenishment. Despite such shortcomings, these newly designed self-propelled carriages offered quick transportation, and by the early 1900s it was not uncommon to see such machines shuttling wealthy citizens around town.

B But the glory days of steam cars were few. A new technology called the Internal Combustion Engine soon appeared, which offered the ability to drive down the road just moments after starting up. At first, these noisy gasoline cars were unpopular because they were more complicated to operate and they had difficult hand-crank starters, which were known to break arms when the engines backfired. But in 1912 General Motors introduced the electric starter, and over the following few years steam power was gradually phased out.

C Even as the market was declining, four brothers made one last effort to rekindle the technology. Between 1906 and 1909, while still attending high school, Abner Doble and his three brothers built their first steam car in their parents' basement. It comprised parts taken from a wrecked early steam car but reconfigured to drive an engine of their own design. Though it did not run well, the Doble brothers went on to build a second and third prototype in the following years. Though the Doble boys' third prototype, nicknamed the Model B, still lacked the convenience of an internal combustion engine, it drew the attention of automobile trade magazines due to its numerous improvements over previous steam cars. The Model B proved to be superior to gasoline automobiles in many ways. Its high-pressure steam drove the engine pistons in virtual silence, in contrast to clattering gas engines which emitted the aroma of burned hydrocarbons. Perhaps most impressively, the Model B was amazingly swift. It could accelerate from zero to sixty miles per hour in just fifteen seconds, a feat described as 'remarkable acceleration' by Automobile magazine in 1914.

D The following year Abner Doble drove the Model B from Massachusetts to Detroit in order to seek investment in his automobile design, which he used to open the General Engineering Company. He and his brothers immediately began working on the Model C, which was intended to expand upon the innovations of the Model B. The brothers added features such as a key-based ignition in the cabin, eliminating the need for the operator to manually ignite the boiler. With these enhancements, the Dobles' new car company promised a steam vehicle which would provide all of the convenience of a gasoline car, but with much greater speed, much simpler driving controls, and a virtually silent powerplant. By the following April, the General Engineering Company had received 5,390 deposits for Doble Detroits, which were scheduled for delivery in early 1918.

E Later that year Abner Doble delivered unhappy news to those eagerly awaiting the delivery of their modern new cars. Those buyers who received the handful of completed cars complained that the vehicles were sluggish and erratic, sometimes going in reverse when they should go forward. The new engine design, though innovative, was still plagued with serious glitches.

F The brothers made one final attempt to produce a viable steam automobile. In early 1924, the Doble brothers shipped a Model E to New York City to be road-tested by the Automobile Club of America. After sitting overnight in freezing temperatures, the car was pushed out into the road and left to sit for over an hour in the frosty morning air. At the turn of the key, the boiler lit and reached its operating pressure inside of forty seconds. As they drove the test vehicle further, they found that its evenly distributed weight lent it surprisingly good handling, even though it was so heavy. As the new Doble steamer was further developed and tested, its maximum speed was pushed to over a hundred miles per hour, and it achieved about fifteen miles per gallon of kerosene with negligible emissions.

G Sadly, the Dobles' brilliant steam car never was a financial success. Priced at around $18,000 in 1924, it was popular only among the very wealthy. Plus, it is said that no two Model Es were quite the same, because Abner Doble tinkered endlessly with the design. By the time the company folded in 1931, fewer than fifty of the amazing Model E steam cars had been produced. For his whole career, until his death in 1961, Abner Doble remained adamant that steam-powered automobiles were at least equal to gasoline cars, if not superior. Given the evidence, he may have been right. Many of the Model E Dobles which have survived are still in good working condition, some having been driven over half a million miles with only normal maintenance. Astonishingly, an unmodified Doble Model E runs clean enough to pass the emissions laws in California today, and they are pretty strict. It is true that the technology poses some difficult problems, but you cannot help but wonder how efficient a steam car might be with the benefit of modern materials and computers. Under the current pressure to improve automotive performance and reduce emissions, it is not unthinkable that the steam car may rise again."""

    p2_q_content = """Questions 14–20
Reading Passage 2 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.
Write the correct number, i–viii, in boxes 14–20 on your answer sheet.

List of Headings
i A period in cold conditions before the technology is assessed
ii Marketing issues lead to failure
iii Good and bad aspects of steam technology are passed on
iv A possible solution to the issues of today
v Further improvements lead to commercial orders
vi Positive publicity at last for this quiet, clean, fast vehicle
vii A disappointing outcome for customers
viii A better option than the steam car arises

14 Paragraph A
15 Paragraph B
16 Paragraph C
17 Paragraph D
18 Paragraph E
19 Paragraph F
20 Paragraph G

Questions 21–23
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 21–23 on your answer sheet.

21 What point does the writer make about the steam car in Paragraph B?
A Its success was short-lived.
B Not enough cars were made.
C Car companies found them hard to sell.
D People found them hard to drive.

22 When building their first steam car, the Doble brothers
A constructed all the parts themselves.
B made written notes at each stage of the construction.
C needed several attempts to achieve a competitive model.
D sought the advice of experienced people in the car industry.

23 In order to produce the Model C, the Doble brothers
A moved production to a different city.
B raised financial capital.
C employed an additional worker.
D abandoned their earlier designs.

Questions 24–26
Complete the summary below.
Choose ONE WORD AND/OR A NUMBER from the passage for each answer.
Write your answers in boxes 24–26 on your answer sheet.

The Model E
The Model E was road-tested in 1924 by the Automobile Club of America. They found it easy to drive, despite its weight, and it impressed the spectators. A later version of the Model E raised its 24 ............... , while keeping its emissions extremely low.

The steam car was too expensive for many people and its design was constantly being altered. Under 25 ............... cars were produced before the company went out of business. However, even today, there are Model Es on the road in the US. They are straightforward to maintain, and they satisfy California's 26 ............... emissions laws. Perhaps today's technology and materials would help us revive the steam car."""

    headings_opts = [
        {"label": "i", "text": "A period in cold conditions before the technology is assessed"},
        {"label": "ii", "text": "Marketing issues lead to failure"},
        {"label": "iii", "text": "Good and bad aspects of steam technology are passed on"},
        {"label": "iv", "text": "A possible solution to the issues of today"},
        {"label": "v", "text": "Further improvements lead to commercial orders"},
        {"label": "vi", "text": "Positive publicity at last for this quiet, clean, fast vehicle"},
        {"label": "vii", "text": "A disappointing outcome for customers"},
        {"label": "viii", "text": "A better option than the steam car arises"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Paragraph A", "options": headings_opts}, "correctAnswer": "iii"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Paragraph B", "options": headings_opts}, "correctAnswer": "viii"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Paragraph C", "options": headings_opts}, "correctAnswer": "vi"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Paragraph D", "options": headings_opts}, "correctAnswer": "v"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Paragraph E", "options": headings_opts}, "correctAnswer": "vii"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Paragraph F", "options": headings_opts}, "correctAnswer": "i"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Paragraph G", "options": headings_opts}, "correctAnswer": "iv"},
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about the steam car in Paragraph B?", "options": [{"label": "A", "text": "Its success was short-lived."}, {"label": "B", "text": "Not enough cars were made."}, {"label": "C", "text": "Car companies found them hard to sell."}, {"label": "D", "text": "People found them hard to drive."}]}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "When building their first steam car, the Doble brothers", "options": [{"label": "A", "text": "constructed all the parts themselves."}, {"label": "B", "text": "made written notes at each stage of the construction."}, {"label": "C", "text": "needed several attempts to achieve a competitive model."}, {"label": "D", "text": "sought the advice of experienced people in the car industry."}]}, "correctAnswer": "C"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "In order to produce the Model C, the Doble brothers", "options": [{"label": "A", "text": "moved production to a different city."}, {"label": "B", "text": "raised financial capital."}, {"label": "C", "text": "employed an additional worker."}, {"label": "D", "text": "abandoned their earlier designs."}]}, "correctAnswer": "B"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "A later version of the Model E raised its 24 ________ , while keeping its emissions extremely low.", "blank": True}, "correctAnswer": "speed"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "Under 25 ________ cars were produced before the company went out of business.", "blank": True}, "correctAnswer": "fifty", "acceptableAnswers": ["fifty", "50"]},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "and they satisfy California's 26 ________ emissions laws.", "blank": True}, "correctAnswer": "strict"},
    ]

    p3_text = """The case for mixed-ability classes

Picture this scene. It's an English literature lesson in a UK school, and the teacher has just read an extract from Shakespeare's Romeo and Juliet with a class of 15-year-olds. He's given some of the students copies of No Fear Shakespeare, a kid-friendly translation of the original. For three students, even these literacy demands are beyond them. Another girl simply can't focus and he gives her pens and paper to draw with. The teacher can ask the No Fear group to identify the key characters and maybe provide a tentative plot summary. He can ask most of the class about character development, and five of them might be able to support their statements with textual evidence. Now two curious students are wondering whether Shakespeare advocates living a life of moderation or one of passionate engagement.

I have heard the mixed-ability model attacked by way of analogy: a group hike. The fittest in the group take the lead and set a brisk pace, only to have to stop and wait every 20 minutes. This is frustrating, and their enthusiasm wanes. Meanwhile, the slowest ones are not only embarrassed but physically struggling to keep up. What's worse, they never get a long enough break. They honestly just want to quit. Hiking, they feel, is not for them.
Mixed-ability classes bore students, frustrate parents and burn out teachers. The brightest ones will never summit Mount Qomolangma, and the stragglers won't enjoy the lovely stroll in the park they are perhaps more suited to. Individuals suffer at the demands of the collective, mediocrity prevails. So: is learning like hiking?

As a teacher myself, I'd think my lesson would be going rather well if the discussion went as described above. But wouldn't this kind of class work better if there weren't such a huge gap between the top and the bottom? If we put all the kids who needed literacy support into one class, and all the students who want to discuss the virtue of moderation into another?

The current pedagogical paradigm is arguably that of constructivism, which emerged out of the work of psychologist Lev Vygotsky. In the 1930s, Vygotsky emphasised the importance of targeting a student's specific 'zone of proximal development' (ZPD). This is the gap between what they can achieve only with support – teachers, textbooks, worked examples, parents and so on – and what they can achieve independently. The purpose of teaching is to provide and then gradually remove this 'scaffolding' until they are autonomous. If we accept this model, it follows that streaming students with similar ZPDs would be an efficient and effective solution. And that forcing everyone on the same hike – regardless of aptitude – would be madness.

The practice of 'streaming', or 'tracking', involves separating students into classes depending on their diagnosed levels of attainment. At a macro level, it requires the establishment of academically selective schools for the brightest students, and comprehensive schools for the rest. Within schools, it means selecting students into a 'stream' of general ability, or 'sets' of subject-specific ability. The practice is intuitively appealing to almost every stakeholder.

Despite all this, there is limited empirical evidence to suggest that streaming results in better outcomes for students. Professor John Hattie, director of the Melbourne Education Research Institute, notes that 'tracking has minimal effects on learning outcomes'. What is more, streaming appears to significantly – and negatively – affect those students assigned to the lowest sets. These students tend to have much higher representation of low socioeconomic class. Less significant is the small benefit for those lucky clever students in the higher sets. The overall result is that the smart stay smart and the dumb get dumber, further entrenching the social divide.

In the latest update of Hattie's influential meta-analysis of factors influencing student achievement, one of the most significant factors is the teachers' estimate of achievement. Streaming students by diagnosed achievement automatically limits what the teacher feels the student is capable of. Meanwhile, in a mixed environment, teachers' estimates need to be more diverse and flexible.

While streaming might seem to help teachers effectively target a student's ZPD, it can underestimate the importance of peer-to-peer learning. A crucial aspect of constructivist theory is the role of the MKO – 'more knowledgeable other' – in knowledge construction. While teachers are traditionally the MKOs in classrooms, the value of knowledgeable student peers must not go unrecognised either.

I find it amazing to watch students get over an idea to their peers in ways that I would never think of. They operate with different language tools and different social tools from teachers and, having just learnt it themselves, they possess similar cognitive structures to their struggling classmates. There is also something exciting about passing on skills and knowledge that you yourself have just mastered – a certain pride and zeal, a certain freshness to the interaction between 'teacher' and 'learner' that is often lost by the expert for whom the steps are obvious and the joy of discovery forgotten.

Having a variety of different abilities in a collaborative learning environment provides valuable resources for helping students meet their learning needs, not to mention improving their communication and social skills. And today, more than ever, we need the many to flourish – not suffer at the expense of a few bright stars. Once a year, I go on a hike with my class, a mixed bunch of students. It is challenging. The fittest students realise they need to encourage the reluctant. There are lookouts who report back, and extra items to carry for others. We make it – together."""

    p3_q_content = """Questions 27–30
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 27–30 on your answer sheet.

27 The writer describes the Romeo and Juliet lesson in order to demonstrate
A how few students are interested in literature.
B how a teacher handles a range of learning needs.
C how unsuitable Shakespeare is for most teenagers.
D how weaker students can disrupt their classmates' learning.

28 What does the writer say about streaming in the third paragraph?
A It has a very broad appeal.
B It favours cleverer students.
C It is relatively simple to implement.
D It works better in some schools than others.

29 What idea is suggested by the reference to Mount Qomolangma in the fifth paragraph?
A students following unsuitable paths
B students attempting interesting tasks
C students not achieving their full potential
D students not being aware of their limitations

30 What does the word 'scaffolding' in the sixth paragraph refer to?
A the factors which prevent a student from learning effectively
B the environment where most of a student's learning takes place
C the assistance given to a student in their initial stages of learning
D the setting of appropriate learning targets for a student's aptitude

Questions 31–35
Complete the summary using the list of phrases, A–I, below.
Write the correct letter, A–I, in boxes 31–35 on your answer sheet.

Is streaming effective?
According to Professor John Hattie of the Melbourne Education Research Institute, there is very little indication that streaming leads to 31 ............... . He points out that, in schools which use streaming, the most significant impact is on those students placed in the 32 ............... , especially where a large proportion of them have 33 ............... . Meanwhile, for the 34 ............... , there appears to be only minimal advantage. A further issue is that teachers tend to have 35 ............... of students in streamed groups.

A wrong classes
B lower expectations
C average learners
D bottom sets
E brightest pupils
F disadvantaged backgrounds
G weaker students
H higher achievements
I positive impressions

Questions 36–40
Do the following statements agree with the views of the writer in Reading Passage 3?
In boxes 36–40 on your answer sheet, write
YES if the statement agrees with the views of the writer
NO if the statement contradicts the views of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

36 The Vygotsky model of education supports the concept of a mixed-ability class.
37 Some teachers are uncertain about allowing students to take on MKO roles in the classroom.
38 It can be rewarding to teach knowledge which you have only recently acquired.
39 The priority should be to ensure that the highest-achieving students attain their goals.
40 Taking part in collaborative outdoor activities with teachers and classmates can improve student outcomes in the classroom."""

    streaming_opts = [
        {"label": "A", "text": "wrong classes"},
        {"label": "B", "text": "lower expectations"},
        {"label": "C", "text": "average learners"},
        {"label": "D", "text": "bottom sets"},
        {"label": "E", "text": "brightest pupils"},
        {"label": "F", "text": "disadvantaged backgrounds"},
        {"label": "G", "text": "weaker students"},
        {"label": "H", "text": "higher achievements"},
        {"label": "I", "text": "positive impressions"},
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "The writer describes the Romeo and Juliet lesson in order to demonstrate", "options": [{"label": "A", "text": "how few students are interested in literature."}, {"label": "B", "text": "how a teacher handles a range of learning needs."}, {"label": "C", "text": "how unsuitable Shakespeare is for most teenagers."}, {"label": "D", "text": "how weaker students can disrupt their classmates' learning."}]}, "correctAnswer": "B"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer say about streaming in the third paragraph?", "options": [{"label": "A", "text": "It has a very broad appeal."}, {"label": "B", "text": "It favours cleverer students."}, {"label": "C", "text": "It is relatively simple to implement."}, {"label": "D", "text": "It works better in some schools than others."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "What idea is suggested by the reference to Mount Qomolangma in the fifth paragraph?", "options": [{"label": "A", "text": "students following unsuitable paths"}, {"label": "B", "text": "students attempting interesting tasks"}, {"label": "C", "text": "students not achieving their full potential"}, {"label": "D", "text": "students not being aware of their limitations"}]}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the word 'scaffolding' in the sixth paragraph refer to?", "options": [{"label": "A", "text": "the factors which prevent a student from learning effectively"}, {"label": "B", "text": "the environment where most of a student's learning takes place"}, {"label": "C", "text": "the assistance given to a student in their initial stages of learning"}, {"label": "D", "text": "the setting of appropriate learning targets for a student's aptitude"}]}, "correctAnswer": "C"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "there is very little indication that streaming leads to 31 ________ .", "options": streaming_opts}, "correctAnswer": "H"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "the most significant impact is on those students placed in the 32 ________", "options": streaming_opts}, "correctAnswer": "D"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "especially where a large proportion of them have 33 ________ .", "options": streaming_opts}, "correctAnswer": "F"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Meanwhile, for the 34 ________ , there appears to be only minimal advantage.", "options": streaming_opts}, "correctAnswer": "E"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "A further issue is that teachers tend to have 35 ________ of students in streamed groups.", "options": streaming_opts}, "correctAnswer": "B"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "The Vygotsky model of education supports the concept of a mixed-ability class.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Some teachers are uncertain about allowing students to take on MKO roles in the classroom.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 38, "order": 37, "type": "TRUE_FALSE_NG", "content": {"stem": "It can be rewarding to teach knowledge which you have only recently acquired.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 39, "order": 38, "type": "TRUE_FALSE_NG", "content": {"stem": "The priority should be to ensure that the highest-achieving students attain their goals.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 40, "order": 39, "type": "TRUE_FALSE_NG", "content": {"stem": "Taking part in collaborative outdoor activities with teachers and classmates can improve student outcomes in the classroom.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    t33_reading = {
        "title": "Test 33.C18.03 - Reading",
        "slug": "test-33-reading",
        "skill": "READING",
        "status": "DRAFT",
        "parts": [
            {"title": "Reading Passage 1", "content": f"{p1_text}\n\n{p1_q_content}", "questions": p1_questions},
            {"title": "Reading Passage 2", "content": f"{p2_text}\n\n{p2_q_content}", "questions": p2_questions},
            {"title": "Reading Passage 3", "content": f"{p3_text}\n\n{p3_q_content}", "questions": p3_questions},
        ]
    }

    return [t33_listening, t33_reading]
