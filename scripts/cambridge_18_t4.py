# Test 34: Cambridge 18 Test 4 (Test 34.C18.04)
import json
import os

def get_test_34():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Job details from employment agency
Role: 1 ...............
Location: Fordham 2 ............... Centre, 3 ............... Road, Fordham

Work involves:
• dealing with enquiries
• making 4 ............... and reorganising them
• maintaining the internal 5 ...............
• general administration

Requirements:
• 6 ............... (essential)
• a calm and 7 ............... manner
• good IT skills

Other information:
• a 8 ............... job – further opportunities may be available
• hours: 7.45 a.m. to 9 ............... p.m. Monday to Friday
• 10 ............... is available onsite"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Role: 1 ________", "blank": True}, "correctAnswer": "receptionist"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Location: Fordham 2 ________ Centre,", "blank": True}, "correctAnswer": "Medical"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "3 ________ Road, Fordham", "blank": True}, "correctAnswer": "Chastons"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "making 4 ________ and reorganising them", "blank": True}, "correctAnswer": "appointments"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "maintaining the internal 5 ________", "blank": True}, "correctAnswer": "database"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "6 ________ (essential)", "blank": True}, "correctAnswer": "experience"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "a calm and 7 ________ manner", "blank": True}, "correctAnswer": "confident"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "a 8 ________ job – further opportunities may be available", "blank": True}, "correctAnswer": "temporary"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "hours: 7.45 a.m. to 9 ________ p.m. Monday to Friday", "blank": True}, "correctAnswer": "1.15", "acceptableAnswers": ["1.15", "1:15", "1.15 pm", "1:15 pm"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "10 ________ is available onsite", "blank": True}, "correctAnswer": "parking"},
    ]

    s2_content = """Questions 11–14
Choose the correct letter, A, B or C.

11 The museum building was originally
A a factory.
B a private home.
C a hall of residence.

12 The university uses part of the museum building as
A teaching rooms.
B a research library.
C administration offices.

13 What does the guide say about the entrance fee?
A Visitors decide whether or not they wish to pay.
B Only children and students receive a discount.
C The museum charges extra for special exhibitions.

14 What are visitors advised to leave in the cloakroom?
A cameras
B coats
C bags

Questions 15–20
What information does the speaker give about each of the following areas of the museum?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 15–20.

Information
A Parents must supervise their children.
B There are new things to see.
C It is closed today.
D This is only for school groups.
E There is a quiz for visitors.
F It features something created by students.
G An expert is here today.
H There is a one-way system.

Areas of museum
15 Four Seasons
16 Farmhouse Kitchen
17 A Year on the Farm
18 Wagon Walk
19 Bees are Magic
20 The Pond"""

    museum_info_opts = [
        {"label": "A", "text": "Parents must supervise their children."},
        {"label": "B", "text": "There are new things to see."},
        {"label": "C", "text": "It is closed today."},
        {"label": "D", "text": "This is only for school groups."},
        {"label": "E", "text": "There is a quiz for visitors."},
        {"label": "F", "text": "It features something created by students."},
        {"label": "G", "text": "An expert is here today."},
        {"label": "H", "text": "There is a one-way system."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "The museum building was originally", "options": [{"label": "A", "text": "a factory."}, {"label": "B", "text": "a private home."}, {"label": "C", "text": "a hall of residence."}]}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "The university uses part of the museum building as", "options": [{"label": "A", "text": "teaching rooms."}, {"label": "B", "text": "a research library."}, {"label": "C", "text": "administration offices."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the guide say about the entrance fee?", "options": [{"label": "A", "text": "Visitors decide whether or not they wish to pay."}, {"label": "B", "text": "Only children and students receive a discount."}, {"label": "C", "text": "The museum charges extra for special exhibitions."}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What are visitors advised to leave in the cloakroom?", "options": [{"label": "A", "text": "cameras"}, {"label": "B", "text": "coats"}, {"label": "C", "text": "bags"}]}, "correctAnswer": "C"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Four Seasons", "options": museum_info_opts}, "correctAnswer": "F"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Farmhouse Kitchen", "options": museum_info_opts}, "correctAnswer": "G"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "A Year on the Farm", "options": museum_info_opts}, "correctAnswer": "E"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Wagon Walk", "options": museum_info_opts}, "correctAnswer": "A"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Bees are Magic", "options": museum_info_opts}, "correctAnswer": "C"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "The Pond", "options": museum_info_opts}, "correctAnswer": "B"},
    ]

    s3_content = """Questions 21 and 22
Choose TWO letters, A–E.
Which TWO educational skills were shown in the video of children doing origami?
A solving problems
B following instructions
C working cooperatively
D learning through play
E developing hand-eye coordination

Questions 23–27
Which comment do the students make about each of the following children in the video?
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 23–27.

Comments
A demonstrated independence
B asked for teacher support
C developed a competitive attitude
D seemed to find the activity calming
E seemed pleased with the results
F seemed confused
G seemed to find the activity easy

Children
23 Sid
24 Jack
25 Naomi
26 Anya
27 Zara

Questions 28–30
Choose the correct letter, A, B or C.

28 Before starting an origami activity in class, the students think it is important for the teacher to
A make models that demonstrate the different stages.
B check children understand the terminology involved.
C tell children not to worry if they find the activity difficult.

29 The students agree that some teachers might be unwilling to use origami in class because
A they may not think that crafts are important.
B they may not have the necessary skills.
C they may worry that it will take up too much time.

30 Why do the students decide to use origami in their maths teaching practice?
A to correct a particular misunderstanding
B to set a challenge
C to introduce a new concept"""

    origami_skills_opts = [
        {"label": "A", "text": "solving problems"},
        {"label": "B", "text": "following instructions"},
        {"label": "C", "text": "working cooperatively"},
        {"label": "D", "text": "learning through play"},
        {"label": "E", "text": "developing hand-eye coordination"},
    ]

    origami_comment_opts = [
        {"label": "A", "text": "demonstrated independence"},
        {"label": "B", "text": "asked for teacher support"},
        {"label": "C", "text": "developed a competitive attitude"},
        {"label": "D", "text": "seemed to find the activity calming"},
        {"label": "E", "text": "seemed pleased with the results"},
        {"label": "F", "text": "seemed confused"},
        {"label": "G", "text": "seemed to find the activity easy"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO educational skills were shown in the video of children doing origami? (Option 1)", "options": origami_skills_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "D"]},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO educational skills were shown in the video of children doing origami? (Option 2)", "options": origami_skills_opts}, "correctAnswer": "D", "acceptableAnswers": ["B", "D"]},
        {"number": 23, "order": 22, "type": "MATCHING", "content": {"stem": "Sid", "options": origami_comment_opts}, "correctAnswer": "D"},
        {"number": 24, "order": 23, "type": "MATCHING", "content": {"stem": "Jack", "options": origami_comment_opts}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Naomi", "options": origami_comment_opts}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Anya", "options": origami_comment_opts}, "correctAnswer": "G"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Zara", "options": origami_comment_opts}, "correctAnswer": "F"},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "Before starting an origami activity in class, the students think it is important for the teacher to", "options": [{"label": "A", "text": "make models that demonstrate the different stages."}, {"label": "B", "text": "check children understand the terminology involved."}, {"label": "C", "text": "tell children not to worry if they find the activity difficult."}]}, "correctAnswer": "A"},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "The students agree that some teachers might be unwilling to use origami in class because", "options": [{"label": "A", "text": "they may not think that crafts are important."}, {"label": "B", "text": "they may not have the necessary skills."}, {"label": "C", "text": "they may worry that it will take up too much time."}]}, "correctAnswer": "B"},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why do the students decide to use origami in their maths teaching practice?", "options": [{"label": "A", "text": "to correct a particular misunderstanding"}, {"label": "B", "text": "to set a challenge"}, {"label": "C", "text": "to introduce a new concept"}]}, "correctAnswer": "C"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Victor Hugo
His novel, Les Misérables
• It has been adapted for theatre and cinema.
• We know more about its overall 31 ............... than about its author.

His early career
• In Paris, his career was successful and he led the Romantic movement.
• He spoke publicly about social issues, such as 32 ............... and education.
• Napoleon III disliked his views and exiled him.

His exile from France
• Victor Hugo had to live elsewhere in 33 ............... .
• He used his income from the sale of some 34 ............... he had written to buy a house on Guernsey.

His house on Guernsey
• Victor Hugo lived in this house until the end of the Empire in France.
• The ground floor contains portraits, 35 ............... and tapestries that he valued.
• He bought cheap 36 ............... made of wood and turned this into beautiful wall carvings.
• The first floor consists of furnished areas with wallpaper and 37 ............... that have a Chinese design.
• The library still contains many of his favourite books.
• He wrote in a room at the top of the house that had a view of the 38 ............... .
• He entertained other writers as well as poor 39 ............... in his house.
• Victor Hugo's 40 ............... gave ownership of the house to the city of Paris in 1927."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "We know more about its overall 31 ________ than about its author.", "blank": True}, "correctAnswer": "plot"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "He spoke publicly about social issues, such as 32 ________ and education.", "blank": True}, "correctAnswer": "poverty"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Victor Hugo had to live elsewhere in 33 ________ .", "blank": True}, "correctAnswer": "Europe"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "He used his income from the sale of some 34 ________ he had written to buy a house on Guernsey.", "blank": True}, "correctAnswer": "poetry"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "The ground floor contains portraits, 35 ________ and tapestries that he valued.", "blank": True}, "correctAnswer": "drawings"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "He bought cheap 36 ________ made of wood and turned this into beautiful wall carvings.", "blank": True}, "correctAnswer": "furniture"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "The first floor consists of furnished areas with wallpaper and 37 ________ that have a Chinese design.", "blank": True}, "correctAnswer": "lamps"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "He wrote in a room at the top of the house that had a view of the 38 ________ .", "blank": True}, "correctAnswer": "harbour", "acceptableAnswers": ["harbour", "harbor"]},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "He entertained other writers as well as poor 39 ________ in his house.", "blank": True}, "correctAnswer": "children"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "Victor Hugo's 40 ________ gave ownership of the house to the city of Paris in 1927.", "blank": True}, "correctAnswer": "relatives"},
    ]

    t34_listening = {
        "title": "Test 34.C18.04 - Listening",
        "slug": "test-34-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-34-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-34-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-34-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-34-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_text = """Green roofs

A Rooftops covered with grass, vegetable gardens and lush foliage are now a common sight in many cities around the world. More and more private companies and city authorities are investing in green roofs, drawn to their wide-ranging benefits. Among the benefits are saving on energy costs, mitigating the risk of floods, making habitats for urban wildlife, tackling air pollution and even growing food. These increasingly radical urban designs can help cities adapt to the monumental problems they face, such as access to resources and a lack of green space due to development. But the involvement of city authorities, businesses and other institutions is crucial to ensuring their success – as is research investigating different options to suit the variety of rooftop spaces found in cities. The UK is relatively new to developing green roofs, and local governments and institutions are playing a major role in spreading the practice. London is home to much of the UK's green roof market, mainly due to forward-thinking policies such as the London Plan, which has paved the way to more than doubling the area of green roofs in the capital.

B Ongoing research is showcasing how green roofs in cities can integrate with 'living walls': environmentally friendly walls which are partially or completely covered with greenery, including a growing medium, such as soil or water. Research also indicates that green roofs can be integrated with drainage systems on the ground, such as street trees, so that the water is managed better and the built environment is made more sustainable. There is also evidence to demonstrate the social value of green roofs. Doctors are increasingly prescribing time spent gardening outdoors for patients dealing with anxiety and depression. And research has found that access to even the most basic green spaces can provide a better quality of life for dementia sufferers and help people avoid obesity.

C In North America, green roofs have become mainstream, with a wide array of expansive, accessible and food-producing roofs installed in buildings. Again, city leaders and authorities have helped push the movement forward – only recently, San Francisco, USA, created a policy requiring new buildings to have green roofs. Toronto, Canada, has policies dating from the 1990s, encouraging the development of urban farms on rooftops. These countries also benefit from having newer buildings than in many parts of the world, which makes it easier to install green roofs. Being able to keep enough water at roof height and distribute it right across the rooftop is crucial to maintaining the plants on any green roof – especially on 'edible roofs' where fruit and vegetables are farmed. And it's much easier to do this in newer buildings, which can typically hold greater weight, than to retro-fit old ones. Having a stronger roof also makes it easier to grow a greater variety of plants, since the soil can be deeper.

D For green roofs to become the norm for new developments, there needs to be support from public authorities and private investors. Those responsible for maintaining buildings may have to acquire new skills, such as landscaping, and in some cases, volunteers may be needed to help out. Other considerations include installing drainage paths, meeting health and safety requirements and perhaps allowing access for the public, as well as planning restrictions and disruption from regular activities in and around the buildings during installation. To convince investors and developers that installing green roofs is worthwhile, economic arguments are still the most important. The term 'natural capital' has been developed to explain the economic value of nature; for example, measuring the money saved by installing natural solutions to protect against flood damage, adapt to climate change or help people lead healthier and happier lives.

E As the expertise about green roofs grows, official standards have been developed to ensure that they are designed, constructed and maintained properly, and function well. Improvements in the science and technology underpinning green roof development have also led to new variations in the concept. For example, 'blue roofs' enable buildings to hold water over longer periods of time, rather than draining it away quickly – crucial in times of heavier rainfall. There are also combinations of green roofs with solar panels, and 'brown roofs' which are wilder in nature and maximise biodiversity. If the trend continues, it could create new jobs and a more vibrant and sustainable local food economy – alongside many other benefits. There are still barriers to overcome, but the evidence so far indicates that green roofs have the potential to transform cities and help them function sustainably long into the future. The success stories need to be studied and replicated elsewhere, to make green, blue, brown and food-producing roofs the norm in cities around the world."""

    p1_q_content = """Questions 1–5
Reading Passage 1 has five paragraphs, A–E.
Which paragraph contains the following information?
Write the correct letter, A–E, in boxes 1–5 on your answer sheet.
NB You may use any letter more than once.

1 mention of several challenges to be overcome before a green roof can be installed
2 reference to a city where green roofs have been promoted for many years
3 a belief that existing green roofs should be used as a model for new ones
4 examples of how green roofs can work in combination with other green urban initiatives
5 the need to make a persuasive argument for the financial benefits of green roofs

Questions 6–9
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 6–9 on your answer sheet.

Advantages of green roofs
City rooftops covered with greenery have many advantages. These include lessening the likelihood that floods will occur, reducing how much money is spent on 6 ............... and creating environments that are suitable for wildlife. In many cases, they can also be used for producing 7 ............... .

There are also social benefits of green roofs. For example, the medical profession recommends 8 ............... as an activity to help people cope with mental health issues. Studies have also shown that the availability of green spaces can prevent physical problems such as 9 ............... .

Questions 10 and 11
Choose TWO letters, A–E.
Write the correct letters in boxes 10 and 11 on your answer sheet.

Which TWO advantages of using newer buildings for green roofs are mentioned in Paragraph C of the passage?
A a longer growing season for edible produce
B more economical use of water
C greater water-storage capacity
D ability to cultivate more plant types
E a large surface area for growing plants

Questions 12 and 13
Choose TWO letters, A–E.
Write the correct letters in boxes 12 and 13 on your answer sheet.

Which TWO aims of new variations on the concept of green roofs are mentioned in Paragraph E of the passage?
A to provide habitats for a wide range of species
B to grow plants successfully even in the wettest climates
C to regulate the temperature of the immediate environment
D to generate power from a sustainable source
E to collect water to supply other buildings"""

    newer_bldgs_opts = [
        {"label": "A", "text": "a longer growing season for edible produce"},
        {"label": "B", "text": "more economical use of water"},
        {"label": "C", "text": "greater water-storage capacity"},
        {"label": "D", "text": "ability to cultivate more plant types"},
        {"label": "E", "text": "a large surface area for growing plants"},
    ]

    new_variations_opts = [
        {"label": "A", "text": "to provide habitats for a wide range of species"},
        {"label": "B", "text": "to grow plants successfully even in the wettest climates"},
        {"label": "C", "text": "to regulate the temperature of the immediate environment"},
        {"label": "D", "text": "to generate power from a sustainable source"},
        {"label": "E", "text": "to collect water to supply other buildings"},
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "MATCHING", "content": {"stem": "mention of several challenges to be overcome before a green roof can be installed", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}]}, "correctAnswer": "D"},
        {"number": 2, "order": 1, "type": "MATCHING", "content": {"stem": "reference to a city where green roofs have been promoted for many years", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}]}, "correctAnswer": "C"},
        {"number": 3, "order": 2, "type": "MATCHING", "content": {"stem": "a belief that existing green roofs should be used as a model for new ones", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}]}, "correctAnswer": "E"},
        {"number": 4, "order": 3, "type": "MATCHING", "content": {"stem": "examples of how green roofs can work in combination with other green urban initiatives", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}]}, "correctAnswer": "B"},
        {"number": 5, "order": 4, "type": "MATCHING", "content": {"stem": "the need to make a persuasive argument for the financial benefits of green roofs", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}]}, "correctAnswer": "D"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "reducing how much money is spent on 6 ________", "blank": True}, "correctAnswer": "energy"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "In many cases, they can also be used for producing 7 ________ .", "blank": True}, "correctAnswer": "food"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "the medical profession recommends 8 ________ as an activity to help people cope with mental health issues.", "blank": True}, "correctAnswer": "gardening"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "green spaces can prevent physical problems such as 9 ________ .", "blank": True}, "correctAnswer": "obesity"},
        {"number": 10, "order": 9, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO advantages of using newer buildings for green roofs are mentioned in Paragraph C of the passage? (Option 1)", "options": newer_bldgs_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "D"]},
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO advantages of using newer buildings for green roofs are mentioned in Paragraph C of the passage? (Option 2)", "options": newer_bldgs_opts}, "correctAnswer": "D", "acceptableAnswers": ["C", "D"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO aims of new variations on the concept of green roofs are mentioned in Paragraph E of the passage? (Option 1)", "options": new_variations_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "D"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO aims of new variations on the concept of green roofs are mentioned in Paragraph E of the passage? (Option 2)", "options": new_variations_opts}, "correctAnswer": "D", "acceptableAnswers": ["A", "D"]},
    ]

    p2_text = """The growth mindset

Over the past century, a powerful idea has taken root in the educational landscape. The concept of intelligence as something innate has been supplanted by the idea that intelligence is not fixed, and that, with the right training, we can be the authors of our own cognitive capabilities. Psychologist Alfred Binet, the developer of the first intelligence tests, was one of many 19th-century scientists who held that earlier view and sought to quantify cognitive ability. Then, in the early 20th century, progressive thinkers revolted against the notion that inherent ability is destiny. Instead, educators such as John Dewey argued that every child's intelligence could be developed, given the right environment.

'Growth mindset theory' is a relatively new – and extremely popular – version of this idea. In many schools today you will see hallways covered in motivational posters and hear speeches on the mindset of great sporting heroes who simply believed their way to the top. A major focus of the growth mindset in schools is coaxing students away from seeing failure as an indication of their ability, and towards seeing it as a chance to improve that ability. As educationalist Jeff Howard noted several decades ago: 'Smart is not something that you just are, smart is something that you can get.'

The idea of the growth mindset is based on the work of psychologist Carol Dweck in California in the 1990s. In one key experiment, Dweck divided a group of 10- to 12-year-olds into two groups. All were told that they had achieved a high score on a test but the first group were praised for their intelligence in achieving this, while the others were praised for their effort. The second group – those who had been instilled with a 'growth mindset' – were subsequently far more likely to put effort into future tasks. Meanwhile, the former took on only those tasks that would not risk their sense of worth. This group had inferred that success or failure is due to innate ability, and this 'fixed mindset' had led them to fear of failure and lack of effort. Praising ability actually made the students perform worse, while praising effort emphasised that change was possible.

One of the greatest impediments to successfully implementing a growth mindset, however, is the education system itself: in many parts of the world, the school climate is obsessed with performance in the form of constant testing, analysing and ranking of students – a key characteristic of the fixed mindset. Nor is it unusual for schools to create a certain cognitive dissonance, when they applaud the benefits of a growth mindset but then hand out fixed target grades in lessons based on performance.

Aside from the implementation problem, the original growth mindset research has also received harsh criticism. The statistician Andrew Gelman claims that 'their research designs have enough degrees of freedom that they could take their data to support just about any theory at all'. Professor of Psychology Timothy Bates, who has been trying to replicate Dweck's work, is finding that the results are repeatedly null. He notes that: 'People with a growth mindset don't cope any better with failure ... Kids with the growth mindset aren't getting better grades, either before or after our intervention study.'

Much of this criticism is not lost on Dweck, and she deserves great credit for responding to it and adapting her work accordingly. In fact, she argues that her work has been misunderstood and misapplied in a range of ways. She has also expressed concerns that her theories are being misappropriated in schools by being conflated with the self-esteem movement: 'For me the growth mindset is a tool for learning and improvement. It's not just a vehicle for making children feel good.'

But there is another factor at work here. The failure to translate the growth mindset into the classroom might reflect a misunderstanding of the nature of teaching and learning itself. Growth mindset supporters David Yeager and Gregory Walton claim that interventions should be delivered in a subtle way to maximise their effectiveness. They say that if adolescents perceive a teacher's intervention as conveying that they are in need of help, this could undo its intended effects.

A lot of what drives students is their innate beliefs and how they perceive themselves. There is a strong correlation between self-perception and achievement, but there is evidence to suggest that the actual effect of achievement on self-perception is stronger than the other way round. To stand up in a classroom and successfully deliver a good speech is a genuine achievement, and that is likely to be more powerfully motivating than vague notions of 'motivation' itself.

Recent evidence would suggest that growth mindset interventions are not the elixir of student learning that its proponents claim it to be. The growth mindset appears to be a viable construct in the lab, which, when administered in the classroom via targeted interventions, doesn't seem to work. It is hard to dispute that having faith in the capacity to change is a good attribute for students. Paradoxically, however, that aspiration is not well served by direct interventions that try to instil it.

Motivational posters and talks are often a waste of time, and might well give students a deluded notion of what success actually means. Teaching concrete skills such as how to write an effective introduction to an essay then praising students' effort in getting there is probably a far better way of improving confidence than telling them how unique they are, or indeed how capable they are of changing their own brains. Perhaps growth mindset works best as a philosophy and not an intervention."""

    p2_q_content = """Questions 14–16
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 14–16 on your answer sheet.

14 What can we learn from the first paragraph?
A where the notion of innate intelligence first began
B when ideas about the nature of intelligence began to shift
C how scientists have responded to changing views of intelligence
D why thinkers turned away from the idea of intelligence being fixed

15 The second paragraph describes how schools encourage students to
A identify their personal ambitions.
B help each other to realise their goals.
C have confidence in their potential to succeed.
D concentrate on where their particular strengths lie.

16 In the third paragraph, the writer suggests that students with a fixed mindset
A tend to be less competitive.
B generally have a low sense of self-esteem.
C will only work hard if they are given constant encouragement.
D are afraid to push themselves beyond what they see as their limitations.

Questions 17–22
Look at the following statements (Questions 17–22) and the list of people below.
Match each statement with the correct person or people, A–E.
Write the correct letter, A–E, in boxes 17–22 on your answer sheet.
NB You may use any letter more than once.

List of People
A Alfred Binet
B Carol Dweck
C Andrew Gelman
D Timothy Bates
E David Yeager and Gregory Walton

17 The methodology behind the growth mindset studies was not strict enough.
18 The idea of the growth mindset has been incorrectly interpreted.
19 Intellectual ability is an unchangeable feature of each individual.
20 The growth mindset should be promoted without students being aware of it.
21 The growth mindset is not simply about boosting students' morale.
22 Research shows that the growth mindset has no effect on academic achievement.

Questions 23–26
Do the following statements agree with the views of the writer in Reading Passage 2?
In boxes 23–26 on your answer sheet, write
YES if the statement agrees with the views of the writer
NO if the statement contradicts the views of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

23 Dweck has handled criticisms of her work in an admirable way.
24 Students' self-perception is a more effective driver of self-confidence than actual achievement is.
25 Recent evidence about growth mindset interventions has attracted unfair coverage in the media.
26 Deliberate attempts to encourage students to strive for high achievement may have a negative effect."""

    mindset_people_opts = [
        {"label": "A", "text": "Alfred Binet"},
        {"label": "B", "text": "Carol Dweck"},
        {"label": "C", "text": "Andrew Gelman"},
        {"label": "D", "text": "Timothy Bates"},
        {"label": "E", "text": "David Yeager and Gregory Walton"},
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What can we learn from the first paragraph?", "options": [{"label": "A", "text": "where the notion of innate intelligence first began"}, {"label": "B", "text": "when ideas about the nature of intelligence began to shift"}, {"label": "C", "text": "how scientists have responded to changing views of intelligence"}, {"label": "D", "text": "why thinkers turned away from the idea of intelligence being fixed"}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "The second paragraph describes how schools encourage students to", "options": [{"label": "A", "text": "identify their personal ambitions."}, {"label": "B", "text": "help each other to realise their goals."}, {"label": "C", "text": "have confidence in their potential to succeed."}, {"label": "D", "text": "concentrate on where their particular strengths lie."}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "In the third paragraph, the writer suggests that students with a fixed mindset", "options": [{"label": "A", "text": "tend to be less competitive."}, {"label": "B", "text": "generally have a low sense of self-esteem."}, {"label": "C", "text": "will only work hard if they are given constant encouragement."}, {"label": "D", "text": "are afraid to push themselves beyond what they see as their limitations."}]}, "correctAnswer": "D"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "The methodology behind the growth mindset studies was not strict enough.", "options": mindset_people_opts}, "correctAnswer": "C"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "The idea of the growth mindset has been incorrectly interpreted.", "options": mindset_people_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Intellectual ability is an unchangeable feature of each individual.", "options": mindset_people_opts}, "correctAnswer": "A"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "The growth mindset should be promoted without students being aware of it.", "options": mindset_people_opts}, "correctAnswer": "E"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "The growth mindset is not simply about boosting students' morale.", "options": mindset_people_opts}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "Research shows that the growth mindset has no effect on academic achievement.", "options": mindset_people_opts}, "correctAnswer": "D"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "Dweck has handled criticisms of her work in an admirable way.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "Students' self-perception is a more effective driver of self-confidence than actual achievement is.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 25, "order": 24, "type": "TRUE_FALSE_NG", "content": {"stem": "Recent evidence about growth mindset interventions has attracted unfair coverage in the media.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 26, "order": 25, "type": "TRUE_FALSE_NG", "content": {"stem": "Deliberate attempts to encourage students to strive for high achievement may have a negative effect.", "options": ynng_opts}, "correctAnswer": "YES"},
    ]

    p3_text = """Alfred Wegener: science, exploration and the theory of continental drift

by Mott T Greene

Introduction
This is a book about the life and scientific work of Alfred Wegener, whose reputation today rests with his theory of continental displacements, better known as 'continental drift'. Wegener proposed this theory in 1912 and developed it extensively for nearly 20 years. His book on the subject, The Origin of Continents and Oceans, went through four editions and was the focus of an international controversy in his lifetime and for some years after his death.

Wegener's basic idea was that many mysteries about the Earth's history could be solved if one supposed that the continents moved laterally, rather than supposing that they remained fixed in place. Wegener showed in great detail how such continental movements were plausible and how they worked, using evidence from a large number of sciences including geology, geophysics, paleontology, and climatology. Wegener's idea – that the continents move – is at the heart of the theory that guides Earth sciences today: namely plate tectonics. Plate tectonics is in many respects quite different from Wegener's proposal, in the same way that modern evolutionary theory is very different from the ideas Charles Darwin proposed in the 1850s about biological evolution. Yet plate tectonics is a descendant of Alfred Wegener's theory of continental drift, in quite the same way that modern evolutionary theory is a descendant of Darwin's theory of natural selection.

When I started writing about Wegener's life and work, one of the most intriguing things about him for me was that, although he came up with a theory on continental drift, he was not a geologist. He trained as an astronomer and pursued a career in atmospheric physics. When he proposed the theory of continental displacements in 1912, he was a lecturer in physics and astronomy at the University of Marburg, in southern Germany. However, he was not an 'unknown'. In 1906 he had set a world record (with his brother Kurt) for time aloft in a hot-air balloon: 52 hours. Between 1906 and 1908 he had taken part in a highly publicized and extremely dangerous expedition to the coast of northeast Greenland. He had also made a name for himself amongst a small circle of meteorologists and atmospheric physicists in Germany as the author of a textbook, Thermodynamics of the Atmosphere (1911), and of a number of interesting scientific papers.

As important as Wegener's work on continental drift has turned out to be, it was largely a sideline to his interest in atmospheric physics, geophysics, and paleoclimatology*, and thus I have been at great pains to put Wegener's work on continental drift in the larger context of his other scientific work, and in the even larger context of atmospheric sciences in his lifetime. This is a 'continental drift book' only to the extent that Wegener was interested in that topic and later became famous for it. My treatment of his other scientific work is no less detailed, though I certainly have devoted more attention to the reception of his ideas on continental displacement, as they were much more controversial than his other work.

Readers interested in the specific detail of Wegener's career will see that he often stopped pursuing a given line of investigation (sometimes for years on end), only to pick it up later. I have tried to provide guideposts to his rapidly shifting interests by characterizing different phases of his life as careers in different sciences, which is reflected in the titles of the chapters. Thus, the index should be a sufficient guide for those interested in a particular aspect of Wegener's life but perhaps not all of it. My own feeling, however, is that the parts do not make as much sense on their own as do all of his activities taken together. In this respect I urge readers to try to experience Wegener's life as he lived it, with all the interruptions, changes of mind, and renewed efforts this entailed.

Wegener left behind a few published works but, as was standard practice, these reported the results of his work – not the journey he took to reach that point. Only a few hundred of the many thousands of letters he wrote and received in his lifetime have survived and he didn't keep notebooks or diaries that recorded his life and activities. He was not active (with a few exceptions) in scientific societies, and did not seek to find influence or advance his ideas through professional contacts and politics, spending most of his time at home in his study reading and writing, or in the field collecting observations.

Some famous scientists, such as Newton, Darwin, and Einstein, left mountains of written material behind, hundreds of notebooks and letters numbering in the tens of thousands. Others, like Michael Faraday, left extensive journals of their thoughts and speculations, parallel to their scientific notebooks. The more such material a scientist leaves behind, the better chance a biographer has of forming an accurate picture of how a scientist's ideas took shape and evolved.

I am firmly of the opinion that most of us, Wegener included, are not in any real sense the authors of our own lives. We plan, think, and act, often with apparent freedom, but most of the time our lives 'happen to us', and we only retrospectively turn this happenstance into a coherent narrative of fulfilled intentions. This book, therefore, is a story both of the life and scientific work that Alfred Wegener planned and intended and of the life and scientific work that actually 'happened to him'. These are, as I think you will soon see, not always the same thing.

* Paleoclimatology – The study of past climates"""

    p3_q_content = """Questions 27–30
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 27–30 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

27 Wegener's ideas about continental drift were widely disputed while he was alive.
28 The idea that the continents remained fixed in place was defended in a number of respected scientific publications.
29 Wegener relied on a limited range of scientific fields to support his theory of continental drift.
30 The similarities between Wegener's theory of continental drift and modern-day plate tectonics are enormous.

Questions 31–36
Complete the summary using the list of phrases, A–J, below.
Write the correct letter, A–J, in boxes 31–36 on your answer sheet.

Wegener's life and work
One of the remarkable things about Wegener from a 31 ............... is that although he proposed a theory of continental drift, he was not a geologist. His 32 ............... were limited to atmospheric physics. However, at the time he proposed his theory of continental drift in 1912, he was already a person of 33 ............... . Six years previously, there had been his 34 ............... of 52 hours in a hot-air balloon, followed by his well-publicised but 35 ............... of Greenland's coast. With the publication of his textbook on thermodynamics, he had also come to the attention of a 36 ............... of German scientists.

A modest fame
B vast range
C record-breaking achievement
D research methods
E select group
F professional interests
G scientific debate
H hazardous exploration
I biographer's perspective
J narrow investigation

Questions 37–40
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 37–40 on your answer sheet.

37 What is Mott T Greene doing in the fifth paragraph?
A describing what motivated him to write the book
B explaining why it is desirable to read the whole book
C suggesting why Wegener pursued so many different careers
D indicating what aspects of Wegener's life interested him most

38 What is said about Wegener in the sixth paragraph?
A He was not a particularly ambitious person.
B He kept a record of all his scientific observations.
C He did not adopt many of the scientific practices of the time.
D He enjoyed discussing new discoveries with other scientists.

39 What does Greene say about some other famous scientists?
A Their published works had a greater impact than Wegener's did.
B They had fewer doubts about their scientific ideas than Wegener did.
C Their scientific ideas were more controversial than Wegener's.
D They are easier subjects to write about than Wegener.

40 What is Greene's main point in the final paragraph?
A It is not enough in life to have good intentions.
B People need to plan carefully if they want to succeed.
C People have little control over many aspects of their lives.
D It is important that people ensure they have the freedom to act."""

    wegener_summary_opts = [
        {"label": "A", "text": "modest fame"},
        {"label": "B", "text": "vast range"},
        {"label": "C", "text": "record-breaking achievement"},
        {"label": "D", "text": "research methods"},
        {"label": "E", "text": "select group"},
        {"label": "F", "text": "professional interests"},
        {"label": "G", "text": "scientific debate"},
        {"label": "H", "text": "hazardous exploration"},
        {"label": "I", "text": "biographer's perspective"},
        {"label": "J", "text": "narrow investigation"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "TRUE_FALSE_NG", "content": {"stem": "Wegener's ideas about continental drift were widely disputed while he was alive.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 28, "order": 27, "type": "TRUE_FALSE_NG", "content": {"stem": "The idea that the continents remained fixed in place was defended in a number of respected scientific publications.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 29, "order": 28, "type": "TRUE_FALSE_NG", "content": {"stem": "Wegener relied on a limited range of scientific fields to support his theory of continental drift.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 30, "order": 29, "type": "TRUE_FALSE_NG", "content": {"stem": "The similarities between Wegener's theory of continental drift and modern-day plate tectonics are enormous.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "One of the remarkable things about Wegener from a 31 ________", "options": wegener_summary_opts}, "correctAnswer": "I"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "His 32 ________ were limited to atmospheric physics.", "options": wegener_summary_opts}, "correctAnswer": "F"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "he was already a person of 33 ________ .", "options": wegener_summary_opts}, "correctAnswer": "A"},
        {"number": 34, "order": 33, "type": "MATCHING", "content": {"stem": "Six years previously, there had been his 34 ________ of 52 hours in a hot-air balloon,", "options": wegener_summary_opts}, "correctAnswer": "C"},
        {"number": 35, "order": 34, "type": "MATCHING", "content": {"stem": "followed by his well-publicised but 35 ________ of Greenland's coast.", "options": wegener_summary_opts}, "correctAnswer": "H"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "he had also come to the attention of a 36 ________ of German scientists.", "options": wegener_summary_opts}, "correctAnswer": "E"},
        {"number": 37, "order": 36, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is Mott T Greene doing in the fifth paragraph?", "options": [{"label": "A", "text": "describing what motivated him to write the book"}, {"label": "B", "text": "explaining why it is desirable to read the whole book"}, {"label": "C", "text": "suggesting why Wegener pursued so many different careers"}, {"label": "D", "text": "indicating what aspects of Wegener's life interested him most"}]}, "correctAnswer": "B"},
        {"number": 38, "order": 37, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is said about Wegener in the sixth paragraph?", "options": [{"label": "A", "text": "He was not a particularly ambitious person."}, {"label": "B", "text": "He kept a record of all his scientific observations."}, {"label": "C", "text": "He did not adopt many of the scientific practices of the time."}, {"label": "D", "text": "He enjoyed discussing new discoveries with other scientists."}]}, "correctAnswer": "A"},
        {"number": 39, "order": 38, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does Greene say about some other famous scientists?", "options": [{"label": "A", "text": "Their published works had a greater impact than Wegener's did."}, {"label": "B", "text": "They had fewer doubts about their scientific ideas than Wegener did."}, {"label": "C", "text": "Their scientific ideas were more controversial than Wegener's."}, {"label": "D", "text": "They are easier subjects to write about than Wegener."}]}, "correctAnswer": "D"},
        {"number": 40, "order": 39, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is Greene's main point in the final paragraph?", "options": [{"label": "A", "text": "It is not enough in life to have good intentions."}, {"label": "B", "text": "People need to plan carefully if they want to succeed."}, {"label": "C", "text": "People have little control over many aspects of their lives."}, {"label": "D", "text": "It is important that people ensure they have the freedom to act."}]}, "correctAnswer": "C"},
    ]

    t34_reading = {
        "title": "Test 34.C18.04 - Reading",
        "slug": "test-34-reading",
        "skill": "READING",
        "status": "DRAFT",
        "parts": [
            {"title": "Reading Passage 1", "content": f"{p1_text}\n\n{p1_q_content}", "questions": p1_questions},
            {"title": "Reading Passage 2", "content": f"{p2_text}\n\n{p2_q_content}", "questions": p2_questions},
            {"title": "Reading Passage 3", "content": f"{p3_text}\n\n{p3_q_content}", "questions": p3_questions},
        ]
    }

    return [t34_listening, t34_reading]
