# Test 28: Cambridge 12 Test 2 (Test 28.C12.02)
import json
import os

def get_test_28():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Events during Kenton Festival
Example: Start date: 16th May

Opening ceremony (first day)
• In town centre, starting at 1 ...............
• The mayor will make a speech
• A 2 ............... will perform
• Performance of a 3 ............... about Helen Tungate (a 4 ...............)
• Evening fireworks display situated across the 5 ...............

Other events
• Videos about relationships that children have with their 6 ...............
  Venue: 7 ............... House
• Performance of 8 ............... dances
  Venue: the 9 ............... market in the town centre
  Time: 2 and 5 pm every day except 1st day of festival
• Several professional concerts and one by children
  Venue: library
  Time: 6.30 pm on the 18th

Tickets
• Tickets available online from festival box office and from shops which have the festival 10 ............... in their windows"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "In town centre, starting at ________", "blank": True}, "correctAnswer": "2.45", "acceptableAnswers": ["2.45", "2:45", "2.45 pm", "2:45 pm"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "A ________ will perform", "blank": True}, "correctAnswer": "band"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Performance of a ________ about Helen Tungate", "blank": True}, "correctAnswer": "play"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "(a ________)", "blank": True}, "correctAnswer": "scientist"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Evening fireworks display situated across the ________", "blank": True}, "correctAnswer": "river"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Videos about relationships that children have with their ________", "blank": True}, "correctAnswer": "grandparents"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Venue: ________ House", "blank": True}, "correctAnswer": "Handsworth"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Performance of ________ dances", "blank": True}, "correctAnswer": "traditional"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Venue: the ________ market in the town centre", "blank": True}, "correctAnswer": "outdoor"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "shops which have the festival ________ in their windows", "blank": True}, "correctAnswer": "logo"},
    ]

    s2_content = """Questions 11–15
Choose the correct letter, A, B or C.

Theatre trip to Munich
11 When the group meet at the airport they will have
A breakfast.
B coffee.
C lunch.

12 The group will be met at Munich Airport by
A an employee at the National Theatre.
B a theatre manager.
C a tour operator.

13 How much will they pay per night for a double room at the hotel?
A 110 euros
B 120 euros
C 150 euros

14 What type of restaurant will they go to on Tuesday evening?
A an Italian restaurant
B a Lebanese restaurant
C a typical restaurant of the region

15 Who will they meet on Wednesday afternoon?
A an actor
B a playwright
C a theatre director

Questions 16–20
What does the man say about the play on each of the following days?
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 16–20.

Comments
A The playwright will be present.
B The play was written to celebrate an anniversary.
C The play will be performed inside a historic building.
D The play will be accompanied by live music.
E The play will be performed outdoors.
F The play will be performed for the first time.
G The performance will be attended by officials from the town.

Days
16 Wednesday
17 Thursday
18 Friday
19 Saturday
20 Monday"""

    play_opts = [
        {"label": "A", "text": "The playwright will be present."},
        {"label": "B", "text": "The play was written to celebrate an anniversary."},
        {"label": "C", "text": "The play will be performed inside a historic building."},
        {"label": "D", "text": "The play will be accompanied by live music."},
        {"label": "E", "text": "The play will be performed outdoors."},
        {"label": "F", "text": "The play will be performed for the first time."},
        {"label": "G", "text": "The performance will be attended by officials from the town."},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "When the group meet at the airport they will have", "options": [{"label": "A", "text": "breakfast."}, {"label": "B", "text": "coffee."}, {"label": "C", "text": "lunch."}]}, "correctAnswer": "B"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "The group will be met at Munich Airport by", "options": [{"label": "A", "text": "an employee at the National Theatre."}, {"label": "B", "text": "a theatre manager."}, {"label": "C", "text": "a tour operator."}]}, "correctAnswer": "C"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "How much will they pay per night for a double room at the hotel?", "options": [{"label": "A", "text": "110 euros"}, {"label": "B", "text": "120 euros"}, {"label": "C", "text": "150 euros"}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What type of restaurant will they go to on Tuesday evening?", "options": [{"label": "A", "text": "an Italian restaurant"}, {"label": "B", "text": "a Lebanese restaurant"}, {"label": "C", "text": "a typical restaurant of the region"}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "Who will they meet on Wednesday afternoon?", "options": [{"label": "A", "text": "an actor"}, {"label": "B", "text": "a playwright"}, {"label": "C", "text": "a theatre director"}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Wednesday", "options": play_opts}, "correctAnswer": "F"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Thursday", "options": play_opts}, "correctAnswer": "B"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Friday", "options": play_opts}, "correctAnswer": "E"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Saturday", "options": play_opts}, "correctAnswer": "G"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Monday", "options": play_opts}, "correctAnswer": "C"},
    ]

    s3_content = """Questions 21–25
Choose the correct letter, A, B or C.

Scandinavian Studies
21 James chose to take Scandinavian Studies because when he was a child
A he was often taken to Denmark.
B his mother spoke to him in Danish.
C a number of Danish people visited his family.

22 When he graduates, James would like to
A take a postgraduate course.
B work in the media.
C become a translator.

23 Which course will end this term?
A Swedish cinema
B Danish television programmes
C Scandinavian literature

24 They agree that James's literature paper this term will be on
A 19th century playwrights.
B the Icelandic sagas.
C modern Scandinavian novels.

25 Beth recommends that James's paper should be
A a historical overview of the genre.
B an in-depth analysis of a single writer.
C a study of the social background to the literature.

Questions 26–30
Complete the flow-chart below.
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 26–30.

Options
A bullet points
B film
C notes
D structure
E student paper
F textbook
G documentary

How James will write his paper on the Vikings
He'll read a 26 ............... and choose his topic.
He'll borrow a 27 ............... from Beth.
He'll plan the 28 ............... of the paper.
He'll read some source material and write 29 ............... .
He'll write the paper using 30 ............... .
He'll write the complete paper."""

    flow_opts = [
        {"label": "A", "text": "bullet points"},
        {"label": "B", "text": "film"},
        {"label": "C", "text": "notes"},
        {"label": "D", "text": "structure"},
        {"label": "E", "text": "student paper"},
        {"label": "F", "text": "textbook"},
        {"label": "G", "text": "documentary"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "James chose to take Scandinavian Studies because when he was a child", "options": [{"label": "A", "text": "he was often taken to Denmark."}, {"label": "B", "text": "his mother spoke to him in Danish."}, {"label": "C", "text": "a number of Danish people visited his family."}]}, "correctAnswer": "C"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "When he graduates, James would like to", "options": [{"label": "A", "text": "take a postgraduate course."}, {"label": "B", "text": "work in the media."}, {"label": "C", "text": "become a translator."}]}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which course will end this term?", "options": [{"label": "A", "text": "Swedish cinema"}, {"label": "B", "text": "Danish television programmes"}, {"label": "C", "text": "Scandinavian literature"}]}, "correctAnswer": "C"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "They agree that James's literature paper this term will be on", "options": [{"label": "A", "text": "19th century playwrights."}, {"label": "B", "text": "the Icelandic sagas."}, {"label": "C", "text": "modern Scandinavian novels."}]}, "correctAnswer": "A"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "Beth recommends that James's paper should be", "options": [{"label": "A", "text": "a historical overview of the genre."}, {"label": "B", "text": "an in-depth analysis of a single writer."}, {"label": "C", "text": "a study of the social background to the literature."}]}, "correctAnswer": "C"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "He'll read a ________ and choose his topic.", "options": flow_opts}, "correctAnswer": "E"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "He'll borrow a ________ from Beth.", "options": flow_opts}, "correctAnswer": "G"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "He'll plan the ________ of the paper.", "options": flow_opts}, "correctAnswer": "D"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "He'll read some source material and write ________ .", "options": flow_opts}, "correctAnswer": "C"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "He'll write the paper using ________ .", "options": flow_opts}, "correctAnswer": "A"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Conflict at work
• Conflict mostly consists of behaviour in the general category of 31 ...............
• Often a result of people wanting to prove their 32 ...............
• Also caused by differences in 33 ............... between people
• 34 '...............' conflicts: people more concerned about own team than about company
• Conflict-related stress can cause 35 ............... that may last for months

Chief Executives (CEOs)
• Many have both 36 ............... and anxiety
• May not like to have their decisions questioned
• There may be conflict between people who have different 37 ...............

Other managers
• A structure that is more 38 ............... may create a feeling of uncertainty about who staff should report to.

Minimising conflict
• Bosses need to try hard to gain 39 ...............
• Someone from outside the company may be given the role of 40 ............... in order to resolve conflicts."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "Conflict mostly consists of behaviour in the general category of ________", "blank": True}, "correctAnswer": "bullying"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "Often a result of people wanting to prove their ________", "blank": True}, "correctAnswer": "superiority"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "Also caused by differences in ________ between people", "blank": True}, "correctAnswer": "personality"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "'________' conflicts: people more concerned about own team than about company", "blank": True}, "correctAnswer": "structural"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Conflict-related stress can cause ________ that may last for months", "blank": True}, "correctAnswer": "absence"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Many have both ________ and anxiety", "blank": True}, "correctAnswer": "confidence"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "There may be conflict between people who have different ________", "blank": True}, "correctAnswer": "visions"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "A structure that is more ________ may create a feeling of uncertainty about who staff should report to.", "blank": True}, "correctAnswer": "democratic"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Bosses need to try hard to gain ________", "blank": True}, "correctAnswer": "respect"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "Someone from outside the company may be given the role of ________ in order to resolve conflicts.", "blank": True}, "correctAnswer": "mediator"},
    ]

    listening_draft = {
        "title": "Test 28.C12.02 - Listening",
        "slug": "test-28-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "audioFiles": [
            "/uploads/audio/test-28-section-1.mp3",
            "/uploads/audio/test-28-section-2.mp3",
            "/uploads/audio/test-28-section-3.mp3",
            "/uploads/audio/test-28-section-4.mp3",
        ],
        "parts": [
            {"title": "Section 1", "order": 0, "content": s1_content, "meta": {"audioUrl": "/uploads/audio/test-28-section-1.mp3"}, "questions": s1_questions},
            {"title": "Section 2", "order": 1, "content": s2_content, "meta": {"audioUrl": "/uploads/audio/test-28-section-2.mp3"}, "questions": s2_questions},
            {"title": "Section 3", "order": 2, "content": s3_content, "meta": {"audioUrl": "/uploads/audio/test-28-section-3.mp3"}, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "content": s4_content, "meta": {"audioUrl": "/uploads/audio/test-28-section-4.mp3"}, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

The risks agriculture faces in developing countries
Synthesis of an online debate

A Two things distinguish food production from all other productive activities: first, every single person needs food each day and has a right to it; and second, it is hugely dependent on nature. These two unique aspects, one political, the other natural, make food production highly vulnerable and different from any other business. At the same time, cultural values are often deeply entrenched in the way food is produced, cooked and eaten in different societies, which adds further complexity to the field.

B Small, family-run farms in developing countries have to contend with additional problems. The risks to food production take many forms, from extreme weather which may wipe out a crop to pests that damage harvests. Poor infrastructure can make it difficult for smallholders to get their goods to market; while basic challenges in accessing credit mean they can be vulnerable to price volatility.

C Kanayo F. Nwanze, President of the International Fund for Agricultural Development, argues that governments can significantly increase investment in agriculture, especially if they collaborate with private investors. He also notes that input subsidies can help reduce vulnerability for smallholders.

D Sophia Murphy, senior adviser to the Institute for Agriculture and Trade Policy, points out that 'high price volatility weakens incentives for smallholders to invest in increasing their output.' Murphy also emphasizes that governments have a role to play in managing risk and ensuring that prices remain relatively stable through food reserves and regulating markets.

E Shenggen Fan, Director General of the International Food Policy Research Institute, held up social safety nets and public welfare programmes in Ethiopia, Brazil and Mexico as valuable ways to address poverty among farming families and reduce their vulnerability to agriculture shocks. However, some commentators responded that cash transfers to poor families do not necessarily translate into increased food security, as these programmes do not always strengthen food production or raise incomes. Regarding state subsidies for agriculture, Rokeya Kabir, Executive Director of Bangladesh Nari Progati Sangha, commented in her essay that these 'have not compensated for the stranglehold exercised by private traders. In fact, studies show that sixty percent of beneficiaries of subsidies are not poor, but rich landowners and non-farmer traders.'

F Nwanze, Murphy and Fan argued that private risk management tools, like private insurance, commodity futures markets, and rural finance can help small-scale producers mitigate risk and allow for investment in improvements. Kabir warned that financial support schemes often encourage the adoption of high-input agricultural practices, which in the medium term may raise production costs beyond the value of their harvests. Murphy noted that when futures markets become excessively financialised, the impacts on food prices can be severe. Commentators emphasised that transparent markets help reduce the impact of volatility, and make evident whether adequate stocks and supplies are available. Others contended that agribusiness companies should be held responsible for paying for negative side effects.

G Many essayists mentioned climate change and its consequences for small-scale agriculture. Fan explained that 'in addition to reducing crop yields, climate change increases the magnitude and the frequency of extreme weather events, which increase smallholder vulnerability.' The growing unpredictability of weather patterns increases farmers' difficulty in managing weather-related risks. According to this author, one solution would be to develop crop varieties that are more resilient to new climate trends and extreme weather patterns. Accordingly, Pat Mooney, co-founder and executive director of the ETC Group, suggested that 'if we are to survive climate change, we must adopt policies that let peasants diversify the plant and animal species and varieties/breeds that make up our menus.'

H Some participating authors and commentators argued in favour of community-based and autonomous risk management strategies through collective action groups, co-operatives or producers' groups. Such groups enhance market opportunities for small-scale producers, reduce marketing costs and synchronise buying and selling with seasonal price conditions. According to Murphy, 'collective action offers an important way for farmers to strengthen their political and economic bargaining power, and to reduce their business risks.' One commentator, Giel Ton, warned that collective action does not come as a free good. It takes time, effort and money to organise, build trust and to experiment. Others, like Marcel Vernooij and Marcel Beukeboom, suggested that in order to 'apply what we already know', all stakeholders, including business, government, scientists and civil society, must work together, starting at the beginning of the value chain.

I Some participants explained that market price volatility is often worsened by the presence of intermediary purchasers who, taking advantage of farmers' vulnerability, dictate prices. One commentator suggested farmers can gain greater control over prices and minimise price volatility by selling directly to consumers. Similarly, Sonali Bisht, founder and advisor to the Institute of Himalayan Environmental Research and Education (INHERE), suggested that 'community-supported agriculture, where consumers invest in local farming and guarantee to buy the produce at a fair price, is a risk-sharing model that deserves more attention.' Direct food distribution systems not only provide producers with greater security, they also give consumers more control over the food they consume, she wrote.

Questions 1–3
Reading Passage 1 has nine paragraphs, A–I.
Which paragraph contains the following information?
Write the correct letter, A–I, in boxes 1–3 on your answer sheet.

1 a reference to characteristics that only apply to food production
2 a reference to challenges faced only by farmers in certain parts of the world
3 a reference to difficulties in bringing about co-operation between farmers

Questions 4–9
Look at the following statements (Questions 4–9) and the list of people below.
Match each statement with the correct person, A–G.
Write the correct letter, A–G, in boxes 4–9 on your answer sheet.
NB You may use any letter more than once.

4 Financial assistance from the government does not always go to the farmers who most need it.
5 Farmers can benefit from collaborating as a group.
6 Financial assistance from the government can improve the standard of living of farmers.
7 Farmers may be helped if there is financial input by the same individuals who buy from them.
8 Governments can help to reduce variation in prices.
9 Improvements to infrastructure can have a major impact on risk for farmers.

List of People
A Kanayo F. Nwanze
B Sophia Murphy
C Shenggen Fan
D Rokeya Kabir
E Pat Mooney
F Giel Ton
G Sonali Bisht

Questions 10 and 11
Choose TWO letters, A–E.
Write the correct letters in boxes 10 and 11 on your answer sheet.
Which TWO problems are mentioned which affect farmers with small farms in developing countries?
A lack of demand for locally produced food
B lack of irrigation programmes
C being unable to get insurance
D the effects of changing weather patterns
E having to sell their goods to intermediary buyers

Questions 12 and 13
Choose TWO letters, A–E.
Write the correct letters in boxes 12 and 13 on your answer sheet.
Which TWO actions are recommended for improving conditions for farmers?
A reducing the size of food stocks
B attempting to ensure that prices rise at certain times of the year
C organising co-operation between a wide range of interested parties
D encouraging consumers to take a financial stake in farming
E making customers aware of the reasons for changing food prices"""

    p1_info_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEFGHI"]
    people_opts = [
        {"label": "A", "text": "Kanayo F. Nwanze"},
        {"label": "B", "text": "Sophia Murphy"},
        {"label": "C", "text": "Shenggen Fan"},
        {"label": "D", "text": "Rokeya Kabir"},
        {"label": "E", "text": "Pat Mooney"},
        {"label": "F", "text": "Giel Ton"},
        {"label": "G", "text": "Sonali Bisht"},
    ]
    problem_opts = [
        {"label": "A", "text": "lack of demand for locally produced food"},
        {"label": "B", "text": "lack of irrigation programmes"},
        {"label": "C", "text": "being unable to get insurance"},
        {"label": "D", "text": "the effects of changing weather patterns"},
        {"label": "E", "text": "having to sell their goods to intermediary buyers"},
    ]
    action_opts = [
        {"label": "A", "text": "reducing the size of food stocks"},
        {"label": "B", "text": "attempting to ensure that prices rise at certain times of the year"},
        {"label": "C", "text": "organising co-operation between a wide range of interested parties"},
        {"label": "D", "text": "encouraging consumers to take a financial stake in farming"},
        {"label": "E", "text": "making customers aware of the reasons for changing food prices"},
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "MATCHING", "content": {"stem": "a reference to characteristics that only apply to food production", "options": p1_info_opts}, "correctAnswer": "A"},
        {"number": 2, "order": 1, "type": "MATCHING", "content": {"stem": "a reference to challenges faced only by farmers in certain parts of the world", "options": p1_info_opts}, "correctAnswer": "B"},
        {"number": 3, "order": 2, "type": "MATCHING", "content": {"stem": "a reference to difficulties in bringing about co-operation between farmers", "options": p1_info_opts}, "correctAnswer": "H"},
        {"number": 4, "order": 3, "type": "MATCHING", "content": {"stem": "Financial assistance from the government does not always go to the farmers who most need it.", "options": people_opts}, "correctAnswer": "D"},
        {"number": 5, "order": 4, "type": "MATCHING", "content": {"stem": "Farmers can benefit from collaborating as a group.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 6, "order": 5, "type": "MATCHING", "content": {"stem": "Financial assistance from the government can improve the standard of living of farmers.", "options": people_opts}, "correctAnswer": "C"},
        {"number": 7, "order": 6, "type": "MATCHING", "content": {"stem": "Farmers may be helped if there is financial input by the same individuals who buy from them.", "options": people_opts}, "correctAnswer": "G"},
        {"number": 8, "order": 7, "type": "MATCHING", "content": {"stem": "Governments can help to reduce variation in prices.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 9, "order": 8, "type": "MATCHING", "content": {"stem": "Improvements to infrastructure can have a major impact on risk for farmers.", "options": people_opts}, "correctAnswer": "A"},
        {"number": 10, "order": 9, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO problems are mentioned which affect farmers with small farms in developing countries? (Option 1)", "options": problem_opts}, "correctAnswer": "D", "acceptableAnswers": ["D", "E"]},
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO problems are mentioned which affect farmers with small farms in developing countries? (Option 2)", "options": problem_opts}, "correctAnswer": "E", "acceptableAnswers": ["D", "E"]},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO actions are recommended for improving conditions for farmers? (Option 1)", "options": action_opts}, "correctAnswer": "C", "acceptableAnswers": ["C", "D"]},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO actions are recommended for improving conditions for farmers? (Option 2)", "options": action_opts}, "correctAnswer": "D", "acceptableAnswers": ["C", "D"]},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

The Lost City of Machu Picchu

A When the US explorer and academic Hiram Bingham arrived in South America in 1911, he was ready for what they would face. He planned to explore the Inca ruins along the Urubamba River, a tributary of the Amazon, in search of Vitcos, the last capital of the Inca empire before its conquest by the Spanish. His goal was to find the historic city and write a book on his discoveries.

B Bingham travelled by mule and on foot from Cuzco down the Urubamba valley, accompanied by a small team and a Peruvian military escort. They followed a newly opened path cut through the canyon by local authorities to facilitate the transport of rubber. The terrain was arduous and the river surged dangerously through granite canyons. The thick tropical vegetation often obscured ancient walls and terraces that local people occasionally reported seeing.

C On 24 July, a local farmer named Melchor Arteaga told Bingham about some ruins high on the ridge opposite their camp, on a peak called Machu Picchu. Bingham was tired and not particularly eager to climb up the steep slope in the intense heat, but he decided to investigate anyway. Accompanied by Arteaga and a soldier, he made the challenging climb up through the dense forest.

D When Bingham reached the clearing at the top, he was astonished by what lay before him. Hidden beneath centuries of jungle growth was a magnificent complex of stone buildings, grand palaces, temples, and terraced fields stretching across the mountain saddle. In his book Inca Land, Bingham gave a dramatic account of the discovery, describing the breathtaking sight of exquisite white granite masonry blending harmoniously with the rugged Andean landscape.

E Although Bingham's account emphasized the heroic solitude of his journey, later historians have pointed out that his discovery was not an entirely solitary breakthrough. Local indigenous families had been living and farming among the terraces of Machu Picchu for decades before Bingham arrived, and other explorers may have visited earlier. However, Bingham's expedition was the first to document, photograph, and systematically survey the site for the international scientific community.

F In 1913, Bingham published a detailed account in National Geographic magazine, accompanied by hundreds of photographs, bringing Machu Picchu to global prominence. He proposed that the ruins represented the birthplace of the Inca civilization or the mysterious mountain refuge known as the 'Lost City of the Incas'.

G Subsequent archaeological excavations have dispelled many of Bingham's romantic theories. Scholars now believe that Machu Picchu was not a military fortress or the final Inca retreat of Vilcabamba, but rather an elite royal estate built for the Inca emperor Pachacuti in the mid-15th century. Nevertheless, Bingham's achievement in bringing the breathtaking site to world attention remains celebrated.

Questions 14–20
Reading Passage 2 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.
Write the correct number, i–viii, in boxes 14–20 on your answer sheet.

List of Headings
i Different accounts of the same journey
ii Bingham gains support
iii A common belief
iv The aim of the trip
v A dramatic description
vi A new route
vii Bingham publishes his theory
viii Bingham's lack of enthusiasm

14 Paragraph A
15 Paragraph B
16 Paragraph C
17 Paragraph D
18 Paragraph E
19 Paragraph F
20 Paragraph G

Questions 21–24
Do the following statements agree with the information given in Reading Passage 2?
In boxes 21–24 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

21 Bingham went to South America in search of an Inca city.
22 Bingham chose a particular route down the Urubamba valley because it was the most common route used by travellers.
23 Bingham understood the significance of Machu Picchu as soon as he saw it.
24 Bingham returned to Machu Picchu in order to find evidence to support his theory.

Questions 25–26
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 25–26 on your answer sheet.

25 The track that took Bingham down the Urubamba valley had been created for the transportation of ............. .
26 Bingham found out about the ruins of Machu Picchu from a ............. in the Urubamba valley."""

    p2_headings = [
        {"label": "i", "text": "Different accounts of the same journey"},
        {"label": "ii", "text": "Bingham gains support"},
        {"label": "iii", "text": "A common belief"},
        {"label": "iv", "text": "The aim of the trip"},
        {"label": "v", "text": "A dramatic description"},
        {"label": "vi", "text": "A new route"},
        {"label": "vii", "text": "Bingham publishes his theory"},
        {"label": "viii", "text": "Bingham's lack of enthusiasm"},
    ]

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "Paragraph A", "options": p2_headings}, "correctAnswer": "iv"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "Paragraph B", "options": p2_headings}, "correctAnswer": "vi"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Paragraph C", "options": p2_headings}, "correctAnswer": "viii"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Paragraph D", "options": p2_headings}, "correctAnswer": "v"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Paragraph E", "options": p2_headings}, "correctAnswer": "i"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Paragraph F", "options": p2_headings}, "correctAnswer": "vii"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "Paragraph G", "options": p2_headings}, "correctAnswer": "iii"},
        {"number": 21, "order": 20, "type": "TRUE_FALSE_NG", "content": {"stem": "Bingham went to South America in search of an Inca city.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 22, "order": 21, "type": "TRUE_FALSE_NG", "content": {"stem": "Bingham chose a particular route down the Urubamba valley because it was the most common route used by travellers.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "Bingham understood the significance of Machu Picchu as soon as he saw it.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "Bingham returned to Machu Picchu in order to find evidence to support his theory.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "The track that took Bingham down the Urubamba valley had been created for the transportation of ________ .", "blank": True}, "correctAnswer": "rubber"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "Bingham found out about the ruins of Machu Picchu from a ________ in the Urubamba valley.", "blank": True}, "correctAnswer": "farmer"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

The benefits of being bilingual

A According to the latest figures, the majority of the world's population is now bilingual or multilingual, having grown up speaking two or more languages. In the past, such children were often considered to be at a disadvantage, and educators believed that learning two languages early in life confused children and hindered their intellectual development. Today, technological advances in neuroimaging and experimental psychology have largely dismantled this idea. Research now shows that being bilingual confers profound cognitive advantages throughout life.

B When a person hears a spoken word, the brain does not wait until the entire word is finished before attempting to identify it. Instead, it activates multiple words that match the initial sounds. In bilingual individuals, this activation occurs across both languages simultaneously. In a seminal experiment, researchers used eye-tracking technology to monitor the eye movements of Russian-English bilinguals as they were asked to look at various objects on a table. When instructed to 'put the stamp below the big square', participants looked at a postage stamp, but they also briefly looked at a competitor object with a name starting with similar sounds in Russian, such as a cup ('tashka'). This phenomenon, known as language co-activation, demonstrates that a bilingual person's languages are constantly active and competing.

C Managing two active languages requires continuous cognitive effort. Because both languages compete for attention, bilingual people must continually suppress the language they are not currently using. This mental juggling act can sometimes cause slight delays; bilingual speakers may occasionally experience more 'tip-of-the-tongue' moments or take slightly longer to retrieve individual words than monolinguals. However, this lifelong mental workout substantially strengthens the brain's executive control system.

D One famous cognitive test used to measure executive control is the Stroop Task, in which participants are shown colour words printed in mismatched ink colours (for example, the word 'RED' printed in blue ink) and asked to name the ink colour. To succeed, participants must inhibit the automatic instinct to read the word and instead focus exclusively on the colour. Bilingual people consistently outperform monolinguals on tasks requiring this type of conflict management. Furthermore, bilinguals are also better at switching between two tasks; for example, when bilinguals have to switch from categorizing objects by colour (red or green) to categorizing them by shape (circle or triangle), they do so more quickly than monolingual people, reflecting better cognitive control when having to make rapid changes of strategy.

E It also seems that the neurological roots of the bilingual advantage extend to brain areas more traditionally associated with sensory processing. When monolingual and bilingual adolescents listen to simple speech sounds without any intervening background noise, they show highly similar brain stem responses. When researchers play the same sound to both groups in the presence of background noise, however, the bilingual listeners' neural response is considerably larger, reflecting better encoding of the sound's fundamental frequency, a feature of sound closely related to pitch perception. Such improvements in cognitive and sensory processing may help a bilingual person to process information in the environment, and help explain why bilingual adults acquire a third language better than monolingual adults master a second language.

F Research also indicates that bilingual experience may help to keep cognitive mechanisms sharp by recruiting alternate brain networks to compensate for those that become damaged during aging. Older bilinguals enjoy improved memory relative to monolingual people, which can lead to real-world health benefits. In a study of over 200 patients with Alzheimer's disease, a degenerative brain disease, bilingual patients reported showing initial symptoms of the disease an average of five years later than monolingual patients. In a follow-up study, researchers compared the brains of bilingual and monolingual patients matched on the severity of Alzheimer's symptoms. Surprisingly, the bilinguals' brains had more physical signs of disease than their monolingual counterparts, even though their outward behaviour and abilities were the same.

G Furthermore, the benefits associated with bilingual experience seem to start very early. In one study, researchers taught seven-month-old babies growing up in monolingual or bilingual homes that when they heard a tinkling sound, a puppet appeared on one side of a screen. Halfway through the study, the puppet began appearing on the opposite side of the screen. In order to get a reward, the infants had to adjust the rule they'd learned; only the bilingual babies were able to successfully learn the new rule. This suggests that for very young children, as well as for older people, navigating a multilingual environment imparts advantages that transfer far beyond language.

Questions 27–31
Complete the table below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
Write your answers in boxes 27–31 on your answer sheet.

| Test | Focus | Findings |
| --- | --- | --- |
| Test of Russian-English bilingual people | Observing the 27 ............... when asked to select certain objects | Bilingual people engage both languages simultaneously: a mechanism known as 28 ............... |
| A test called the 29 ............... | Focusing on naming colours | Bilingual people are more able to handle tasks involving a skill called 30 ............... |
| A test involving switching between tasks | Changing strategies | When changing strategies, bilingual people have superior 31 ............... |

Questions 32–36
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 32–36 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

32 Attitudes towards bilingualism have changed in recent years.
33 Bilingual people are better than monolingual people at guessing correctly what words are before they are finished.
34 Bilingual people consistently name images faster than monolingual people.
35 Bilingual people's brains process single sounds more efficiently than monolingual people in all situations.
36 Fewer bilingual people than monolingual people suffer from brain disease in old age.

Questions 37–40
Reading Passage 3 has seven paragraphs, A–G.
Which paragraph contains the following information?
Write the correct letter, A–G, in boxes 37–40 on your answer sheet.

37 an example of how bilingual and monolingual people's brains respond differently to a certain type of non-verbal auditory input
38 a demonstration of how a bilingual upbringing has benefits even before we learn to speak
39 a description of the process by which people identify words that they hear
40 reference to some negative consequences of being bilingual"""

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]
    p3_info_opts = [{"label": c, "text": f"Paragraph {c}"} for c in "ABCDEFG"]

    p3_questions = [
        {"number": 27, "order": 26, "type": "GAP_FILL", "content": {"stem": "Observing the ________ when asked to select certain objects", "blank": True}, "correctAnswer": "eye movements"},
        {"number": 28, "order": 27, "type": "GAP_FILL", "content": {"stem": "a mechanism known as ________", "blank": True}, "correctAnswer": "language co-activation"},
        {"number": 29, "order": 28, "type": "GAP_FILL", "content": {"stem": "A test called the ________", "blank": True}, "correctAnswer": "Stroop Task"},
        {"number": 30, "order": 29, "type": "GAP_FILL", "content": {"stem": "Bilingual people are more able to handle tasks involving a skill called ________", "blank": True}, "correctAnswer": "conflict management"},
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "When changing strategies, bilingual people have superior ________", "blank": True}, "correctAnswer": "cognitive control"},
        {"number": 32, "order": 31, "type": "TRUE_FALSE_NG", "content": {"stem": "Attitudes towards bilingualism have changed in recent years.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 33, "order": 32, "type": "TRUE_FALSE_NG", "content": {"stem": "Bilingual people are better than monolingual people at guessing correctly what words are before they are finished.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "Bilingual people consistently name images faster than monolingual people.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "Bilingual people's brains process single sounds more efficiently than monolingual people in all situations.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Fewer bilingual people than monolingual people suffer from brain disease in old age.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "an example of how bilingual and monolingual people's brains respond differently to a certain type of non-verbal auditory input", "options": p3_info_opts}, "correctAnswer": "D"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "a demonstration of how a bilingual upbringing has benefits even before we learn to speak", "options": p3_info_opts}, "correctAnswer": "G"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "a description of the process by which people identify words that they hear", "options": p3_info_opts}, "correctAnswer": "B"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "reference to some negative consequences of being bilingual", "options": p3_info_opts}, "correctAnswer": "C"},
    ]

    reading_draft = {
        "title": "Test 28.C12.02 - Reading",
        "slug": "test-28-reading",
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
