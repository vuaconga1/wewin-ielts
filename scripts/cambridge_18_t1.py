# Test 31: Cambridge 18 Test 1 (Test 31.C18.01)
import json
import os

def get_test_31():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Transport survey
Name: Sadie Jones
Year of birth: 1991
Postcode: 1 ...............

Travelling by bus
Date of bus journey: 2 ...............
Reason for trip: shopping and visit to the 3 ...............
Travelled by bus because cost of 4 ............... too high
Got on bus at 5 ............... Street
Complaints about bus service:
- bus today was 6 ...............
- frequency of buses in the 7 ...............

Travelling by car
Goes to the 8 ............... by car

Travelling by bicycle
Dislikes travelling by bike in the city centre because of the 9 ...............
Doesn't own a bike because of a lack of 10 ..............."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Postcode: 1 ________", "blank": True}, "correctAnswer": "DW30 7YZ", "acceptableAnswers": ["DW30 7YZ", "DW307YZ"]},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "Date of bus journey: 2 ________", "blank": True}, "correctAnswer": "24(th) April", "acceptableAnswers": ["24 April", "24th April", "24th of April", "April 24", "April 24th"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Reason for trip: shopping and visit to the 3 ________", "blank": True}, "correctAnswer": "dentist"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Travelled by bus because cost of 4 ________ too high", "blank": True}, "correctAnswer": "parking"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Got on bus at 5 ________ Street", "blank": True}, "correctAnswer": "Claxby"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "bus today was 6 ________", "blank": True}, "correctAnswer": "late"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "frequency of buses in the 7 ________", "blank": True}, "correctAnswer": "evening", "acceptableAnswers": ["evening", "evenings"]},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Goes to the 8 ________ by car", "blank": True}, "correctAnswer": "supermarket"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Dislikes travelling by bike in the city centre because of the 9 ________", "blank": True}, "correctAnswer": "pollution"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Doesn't own a bike because of a lack of 10 ________", "blank": True}, "correctAnswer": "storage"},
    ]

    s2_content = """Questions 11–13
Choose the correct letter, A, B or C.

Becoming a volunteer for ACE
11 Why does the speaker apologise about the seats?
A They are too small.
B There are not enough of them.
C Some of them are very close together.

12 What does the speaker say about the age of volunteers?
A The age of volunteers is less important than other factors.
B Young volunteers are less reliable than older ones.
C Most volunteers are about 60 years old.

13 What does the speaker say about training?
A It is continuous.
B It is conducted by a manager.
C It takes place online.

Questions 14 and 15
Choose TWO letters, A–E.
Which TWO issues does the speaker ask the audience to consider before they apply to be volunteers?
A their financial situation
B their level of commitment
C their work experience
D their ambition
E their availability

Questions 16–20
What does the speaker suggest would be helpful for each of the following areas of voluntary work?
Choose FIVE answers from the box and write the correct letter, A–G, next to Questions 16–20.

Helpful things volunteers might offer
A experience on stage
B original, new ideas
C parenting skills
D an understanding of food and diet
E retail experience
F a good memory
G a good level of fitness

Area of voluntary work
16 Fundraising
17 Litter collection
18 'Playmates'
19 Story club
20 First aid"""

    volunteer_issues_opts = [
        {"label": "A", "text": "their financial situation"},
        {"label": "B", "text": "their level of commitment"},
        {"label": "C", "text": "their work experience"},
        {"label": "D", "text": "their ambition"},
        {"label": "E", "text": "their availability"},
    ]

    volunteer_skills_opts = [
        {"label": "A", "text": "experience on stage"},
        {"label": "B", "text": "original, new ideas"},
        {"label": "C", "text": "parenting skills"},
        {"label": "D", "text": "an understanding of food and diet"},
        {"label": "E", "text": "retail experience"},
        {"label": "F", "text": "a good memory"},
        {"label": "G", "text": "a good level of fitness"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Why does the speaker apologise about the seats?", "options": [{"label": "A", "text": "They are too small."}, {"label": "B", "text": "There are not enough of them."}, {"label": "C", "text": "Some of them are very close together."}]}, "correctAnswer": "C"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the speaker say about the age of volunteers?", "options": [{"label": "A", "text": "The age of volunteers is less important than other factors."}, {"label": "B", "text": "Young volunteers are less reliable than older ones."}, {"label": "C", "text": "Most volunteers are about 60 years old."}]}, "correctAnswer": "A"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the speaker say about training?", "options": [{"label": "A", "text": "It is continuous."}, {"label": "B", "text": "It is conducted by a manager."}, {"label": "C", "text": "It takes place online."}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO issues does the speaker ask the audience to consider before they apply to be volunteers? (Option 1)", "options": volunteer_issues_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO issues does the speaker ask the audience to consider before they apply to be volunteers? (Option 2)", "options": volunteer_issues_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "Fundraising", "options": volunteer_skills_opts}, "correctAnswer": "B"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Litter collection", "options": volunteer_skills_opts}, "correctAnswer": "G"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "'Playmates'", "options": volunteer_skills_opts}, "correctAnswer": "D"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "Story club", "options": volunteer_skills_opts}, "correctAnswer": "A"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "First aid", "options": volunteer_skills_opts}, "correctAnswer": "F"},
    ]

    s3_content = """Questions 21–26
Choose the correct letter, A, B or C.

Talk on jobs in fashion design
21 What problem did Chantal have at the start of the talk?
A Her view of the speaker was blocked.
B She was unable to find an empty seat.
C The students next to her were talking.

22 What were Hugo and Chantal surprised to hear about the job market?
A It has become more competitive than it used to be.
B There is more variety in it than they had realised.
C Some areas of it are more exciting than others.

23 Hugo and Chantal agree that the speaker's message was
A unfair to them at times.
B hard for them to follow.
C critical of the industry.

24 What do Hugo and Chantal criticise about their school careers advice?
A when they received the advice
B how much advice was given
C who gave the advice

25 When discussing their future, Hugo and Chantal disagree on
A which is the best career in fashion.
B when to choose a career in fashion.
C why they would like a career in fashion.

26 How does Hugo feel about being an unpaid assistant?
A He is realistic about the practice.
B He feels the practice is dishonest.
C He thinks others want to change the practice.

Questions 27 and 28
Choose TWO letters, A–E.
Which TWO mistakes did the speaker admit she made in her first job?
A being dishonest to her employer
B paying too much attention to how she looked
C expecting to become well known
D trying to earn a lot of money
E openly disliking her client

Questions 29 and 30
Choose TWO letters, A–E.
Which TWO pieces of retail information do Hugo and Chantal agree would be useful?
A the reasons people return fashion items
B how much time people have to shop for clothes
C fashion designs people want but can't find
D the best time of year for fashion buying
E the most popular fashion sizes"""

    mistakes_opts = [
        {"label": "A", "text": "being dishonest to her employer"},
        {"label": "B", "text": "paying too much attention to how she looked"},
        {"label": "C", "text": "expecting to become well known"},
        {"label": "D", "text": "trying to earn a lot of money"},
        {"label": "E", "text": "openly disliking her client"},
    ]

    retail_opts = [
        {"label": "A", "text": "the reasons people return fashion items"},
        {"label": "B", "text": "how much time people have to shop for clothes"},
        {"label": "C", "text": "fashion designs people want but can't find"},
        {"label": "D", "text": "the best time of year for fashion buying"},
        {"label": "E", "text": "the most popular fashion sizes"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "What problem did Chantal have at the start of the talk?", "options": [{"label": "A", "text": "Her view of the speaker was blocked."}, {"label": "B", "text": "She was unable to find an empty seat."}, {"label": "C", "text": "The students next to her were talking."}]}, "correctAnswer": "A"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "What were Hugo and Chantal surprised to hear about the job market?", "options": [{"label": "A", "text": "It has become more competitive than it used to be."}, {"label": "B", "text": "There is more variety in it than they had realised."}, {"label": "C", "text": "Some areas of it are more exciting than others."}]}, "correctAnswer": "B"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Hugo and Chantal agree that the speaker's message was", "options": [{"label": "A", "text": "unfair to them at times."}, {"label": "B", "text": "hard for them to follow."}, {"label": "C", "text": "critical of the industry."}]}, "correctAnswer": "A"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "What do Hugo and Chantal criticise about their school careers advice?", "options": [{"label": "A", "text": "when they received the advice"}, {"label": "B", "text": "how much advice was given"}, {"label": "C", "text": "who gave the advice"}]}, "correctAnswer": "C"},
        {"number": 25, "order": 24, "type": "MULTIPLE_CHOICE", "content": {"stem": "When discussing their future, Hugo and Chantal disagree on", "options": [{"label": "A", "text": "which is the best career in fashion."}, {"label": "B", "text": "when to choose a career in fashion."}, {"label": "C", "text": "why they would like a career in fashion."}]}, "correctAnswer": "B"},
        {"number": 26, "order": 25, "type": "MULTIPLE_CHOICE", "content": {"stem": "How does Hugo feel about being an unpaid assistant?", "options": [{"label": "A", "text": "He is realistic about the practice."}, {"label": "B", "text": "He feels the practice is dishonest."}, {"label": "C", "text": "He thinks others want to change the practice."}]}, "correctAnswer": "A"},
        {"number": 27, "order": 26, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO mistakes did the speaker admit she made in her first job? (Option 1)", "options": mistakes_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "E"]},
        {"number": 28, "order": 27, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO mistakes did the speaker admit she made in her first job? (Option 2)", "options": mistakes_opts}, "correctAnswer": "E", "acceptableAnswers": ["B", "E"]},
        {"number": 29, "order": 28, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO pieces of retail information do Hugo and Chantal agree would be useful? (Option 1)", "options": retail_opts}, "correctAnswer": "A", "acceptableAnswers": ["A", "C"]},
        {"number": 30, "order": 29, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO pieces of retail information do Hugo and Chantal agree would be useful? (Option 2)", "options": retail_opts}, "correctAnswer": "C", "acceptableAnswers": ["A", "C"]},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Elephant translocation
Reasons for overpopulation at Majete National Park
• strict enforcement of anti-poaching laws
• successful breeding

Problems caused by elephant overpopulation
• greater competition, causing hunger for elephants
• damage to 31 ............... in the park

The translocation process
• a suitable group of elephants from the same 32 ............... was selected
• vets and park staff made use of 33 ............... to help guide the elephants into an open plain
• elephants were immobilised with tranquilisers
  - this process had to be completed quickly to reduce 34 ...............
  - elephants had to be turned on their 35 ............... to avoid damage to their lungs
  - elephants' 36 ............... had to be monitored constantly
  - tracking devices were fitted to the matriarchs
  - data including the size of their tusks and 37 ............... was taken
• elephants were taken by truck to their new reserve

Advantages of translocation at Nkhotakota Wildlife Park
• 38 ............... opportunities
• a reduction in the number of poachers and 39 ...............
• an example of conservation that other parks can follow
• an increase in 40 ............... as a contributor to GDP"""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "damage to 31 ________ in the park", "blank": True}, "correctAnswer": "fences"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "a suitable group of elephants from the same 32 ________ was selected", "blank": True}, "correctAnswer": "family"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "vets and park staff made use of 33 ________ to help guide the elephants into an open plain", "blank": True}, "correctAnswer": "helicopters"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "this process had to be completed quickly to reduce 34 ________", "blank": True}, "correctAnswer": "stress"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "elephants had to be turned on their 35 ________ to avoid damage to their lungs", "blank": True}, "correctAnswer": "sides"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "elephants' 36 ________ had to be monitored constantly", "blank": True}, "correctAnswer": "breathing"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "data including the size of their tusks and 37 ________ was taken", "blank": True}, "correctAnswer": "feet"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "38 ________ opportunities", "blank": True}, "correctAnswer": "employment"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "a reduction in the number of poachers and 39 ________", "blank": True}, "correctAnswer": "weapons"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "an increase in 40 ________ as a contributor to GDP", "blank": True}, "correctAnswer": "tourism"},
    ]

    t31_listening = {
        "title": "Test 31.C18.01 - Listening",
        "slug": "test-31-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-31-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-31-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-31-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-31-section-4.mp3", "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_text = """Urban farming

In Paris, urban farmers are trying a soil-free approach to agriculture that uses less space and fewer resources. Could it help cities face the threats to our food supplies?

On top of a striking new exhibition hall in southern Paris, the world's largest urban rooftop farm has started to bear fruit. Strawberries that are small, intensely flavoured and resplendently red sprout abundantly from large plastic tubes. Peer inside and you see the tubes are completely hollow, the roots of dozens of strawberry plants dangling down inside them. From identical vertical tubes nearby burst row upon row of lettuces; near those are aromatic herbs, such as basil, sage and peppermint. Opposite, in narrow, horizontal trays packed not with soil but with coconut fibre, grow cherry tomatoes, shiny aubergines and brightly coloured chards.

Pascal Hardy, an engineer and sustainable development consultant, began experimenting with vertical farming and aeroponic growing towers – as the soil-free plastic tubes are known – on his Paris apartment block roof five years ago. The urban rooftop space above the exhibition hall is somewhat bigger: 14,000 square metres and almost exactly the size of a couple of football pitches. Already, the team of young urban farmers who tend it have picked, in one day, 3,000 lettuces and 150 punnets of strawberries. When the remaining two thirds of the vast open area are in production, 20 staff will harvest up to 1,000 kg of perhaps 35 different varieties of fruit and vegetables, every day. 'We're not ever, obviously, going to feed the whole city this way,' cautions Hardy. 'In the urban environment you're working with very significant practical constraints, clearly, on what you can do and where. But if enough unused space can be developed like this, there's no reason why you shouldn't eventually target maybe between 5% and 10% of consumption.'

Perhaps most significantly, however, this is a real-life showcase for the work of Hardy's flourishing urban agriculture consultancy, Agripolis, which is currently fielding enquiries from around the world to design, build and equip a new breed of soil-free inner-city farm. 'The method's advantages are many,' he says. 'First, I don't much like the fact that most of the fruit and vegetables we eat have been treated with something like 17 different pesticides, or that the intensive farming techniques that produced them are such huge generators of greenhouse gases. I don't much like the fact, either, that they've travelled an average of 2,000 refrigerated kilometres to my plate, that their quality is so poor, because the varieties are selected for their capacity to withstand such substantial journeys, or that 80% of the price I pay goes to wholesalers and transport companies, not the producers.'

Produce grown using this soil-free method, on the other hand – which relies solely on a small quantity of water, enriched with organic nutrients, pumped around a closed circuit of pipes, towers and trays – is 'produced up here, and sold locally, just down there. It barely travels at all,' Hardy says. 'You can select crop varieties for their flavour, not their resistance to the transport and storage chain, and you can pick them when they're really at their best, and not before.' No soil is exhausted, and the water that gently showers the plants' roots every 12 minutes is recycled, so the method uses 90% less water than a classic intensive farm for the same yield.

Urban farming is not, of course, a new phenomenon. Inner-city agriculture is booming from Shanghai to Detroit and Tokyo to Bangkok. Strawberries are being grown in disused shipping containers, mushrooms in underground carparks. Aeroponic farming, he says, is 'virtuous'. The equipment weighs little, can be installed on almost any flat surface and is cheap to buy: roughly €100 to €150 per square metre. It is cheap to run, too, consuming a tiny fraction of the electricity used by some techniques.

Produce grown this way typically sells at prices that, while generally higher than those of classic intensive agriculture, are lower than soil-based organic growers. There are limits to what farmers can grow this way, of course, and much of the produce is suited to the summer months. 'Root vegetables we cannot do, at least not yet,' he says. 'Radishes are OK, but carrots, potatoes, that kind of thing – the roots are simply too long. Fruit trees are obviously not an option. And beans tend to take up a lot of space for not much return.' Nevertheless, urban farming of the kind being practised in Paris is one part of a bigger and fast-changing picture that is bringing food production closer to our lives."""

    p1_q_content = """Questions 1–3
Complete the sentences below.
Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.

1 Vertical tubes are used to grow strawberries, 1 ............... and herbs.
2 There will eventually be a daily harvest of as much as 2 ............... in weight of fruit and vegetables.
3 It may be possible that the farm's produce will account for as much as 10% of the city's 3 ............... overall.

Questions 4–7
Complete the table below.
Choose ONE WORD ONLY from the passage for each answer.

Intensive farming versus aeroponic urban farming

| Method | Growth | Selection | Sale |
| --- | --- | --- | --- |
| Intensive farming | • wide range of 4 ............... used<br>• techniques pollute air | • quality not good<br>• varieties of fruit and vegetables chosen that can survive long 5 ............... | • 6 ............... receive very little of overall income |
| Aeroponic urban farming | • no soil used<br>• nutrients added to water, which is recycled | • produce chosen because of its 7 ............... | |

Questions 8–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 8–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

8 Urban farming can take place above or below ground.
9 Some of the equipment used in aeroponic farming can be made by hand.
10 Urban farming relies more on electricity than some other types of farming.
11 Fruit and vegetables grown on an aeroponic urban farm are cheaper than traditionally grown organic produce.
12 Most produce can be grown on an aeroponic urban farm at any time of the year.
13 Beans take longer to grow on an urban farm than other vegetables."""

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"}
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Vertical tubes are used to grow strawberries, 1 ________ and herbs.", "blank": True}, "correctAnswer": "lettuces"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "There will eventually be a daily harvest of as much as 2 ________ in weight of fruit and vegetables.", "blank": True}, "correctAnswer": "1,000 kg", "acceptableAnswers": ["1,000 kg", "1000 kg", "1,000kg", "1000kg", "1,000 kilograms", "1000 kilograms"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "It may be possible that the farm's produce will account for as much as 10% of the city's 3 ________ overall.", "blank": True}, "correctAnswer": "(food) consumption", "acceptableAnswers": ["consumption", "food consumption"]},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Intensive farming growth: wide range of 4 ________ used", "blank": True}, "correctAnswer": "pesticides"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Intensive farming selection: varieties of fruit and vegetables chosen that can survive long 5 ________", "blank": True}, "correctAnswer": "journeys"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Intensive farming sale: 6 ________ receive very little of overall income", "blank": True}, "correctAnswer": "producers"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "Aeroponic urban farming selection: produce chosen because of its 7 ________", "blank": True}, "correctAnswer": "flavour", "acceptableAnswers": ["flavour", "flavor"]},
        {"number": 8, "order": 7, "type": "TRUE_FALSE_NG", "content": {"stem": "Urban farming can take place above or below ground.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "Some of the equipment used in aeroponic farming can be made by hand.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Urban farming relies more on electricity than some other types of farming.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "Fruit and vegetables grown on an aeroponic urban farm are cheaper than traditionally grown organic produce.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Most produce can be grown on an aeroponic urban farm at any time of the year.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "Beans take longer to grow on an urban farm than other vegetables.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
    ]

    p2_text = """Forest management in Pennsylvania, USA

How managing low-quality wood (also known as low-use wood) for bioenergy can encourage sustainable forest management

A A tree's 'value' depends on several factors including its species, size, form, condition, quality, function, and accessibility, and depends on the management goals for a given forest. The same tree can be valued very differently by each person who looks at it. A large, straight black cherry tree has high value as timber to be cut into logs or made into furniture, but for a landowner more interested in wildlife habitat, the real value of that stem (or trunk) may be the food it provides to animals. Likewise, if the tree suffers from black knot disease, its value for timber decreases, but to a woodworker interested in making bowls, it brings an opportunity for a unique and beautiful piece of art.

B In the past, Pennsylvania landowners were solely interested in the value of their trees as high-quality timber. The norm was to remove the stems of highest quality and leave behind poorly formed trees that were not as well suited to the site where they grew. This practice, called 'high-grading', has left a legacy of 'low-use wood' in the forests. Some people even call these 'junk trees', and they are abundant in Pennsylvania. These trees have lower economic value for traditional timber markets, compete for growth with higher-value trees, shade out desirable regeneration and decrease the health of a stand* leaving it more vulnerable to poor weather and disease. Management that specifically targets low-use wood can help landowners manage these forest health issues, and wood energy markets help promote this.

C Wood energy markets can accept less expensive wood material of lower quality than would be suitable for traditional timber markets. Most wood used for energy in Pennsylvania is used to produce heat or electricity through combustion. Many schools and hospitals use wood boiler systems to heat and power their facilities, many homes are primarily heated with wood, and some coal plants incorporate wood into their coal streams to produce electricity. Wood can also be gasified for electrical generation and can even be made into liquid fuels like ethanol and gasoline for lorries and cars. All these products are made primarily from low-use wood. Several tree- and plant-cutting approaches, which could greatly improve the long-term quality of a forest, focus strongly or solely on the use of wood for those markets.

D One such approach is called a Timber Stand Improvement (TSI) Cut. In a TSI Cut, really poor-quality tree and plant material is cut down to allow more space, light, and other resources to the highest-valued stems that remain. Removing invasive plants might be another primary goal of a TSI Cut. The stems that are left behind might then grow in size and develop more foliage and larger crowns or tops that produce more coverage for wildlife; they have a better chance to regenerate in a less crowded environment. TSI Cuts can be tailored to one farmer's specific management goals for his or her land.

E Another approach that might yield a high amount of low-use wood is a Salvage Cut. With the many pests and pathogens visiting forests including hemlock wooly adelgid, Asian longhorned beetle, emerald ash borer, and gypsy moth, to name just a few, it is important to remember that those working in the forests can help ease these issues through cutting procedures. These types of cut reduce the number of sick trees and seek to manage the future spread of a pest problem. They leave vigorous trees that have stayed healthy enough to survive the outbreak.

F A Shelterwood Cut, which only takes place in a mature forest that has already been thinned several times, involves removing all the mature trees when other seedlings have become established. This then allows the forester to decide which tree species are regenerated. It leaves a young forest where all trees are at a similar point in their growth. It can also be used to develop a two-tier forest so that there are two harvests and the money that comes in is spread out over a decade or more.

G Thinnings and dense and dead wood removal for fire prevention also center on the production of low-use wood. However, it is important to remember that some retention of what many would classify as low-use wood is very important. The tops of trees that have been cut down should be left on the site so that their nutrients cycle back into the soil. In addition, trees with many cavities are extremely important habitats for insect predators like woodpeckers, bats and small mammals. They help control problem insects and increase the health and resilience of the forest. It is also important to remember that not all small trees are low-use. For example, many species like hawthorn provide food for wildlife. Finally, rare species of trees in a forest should also stay behind as they add to its structural diversity.

* Stand – An area covered with trees that have common features (e.g. size)"""

    p2_q_content = """Questions 14–18
Reading Passage 2 has seven paragraphs, A–G.
Which paragraph contains the following information?
Write the correct letter, A–G, in boxes 14–18 on your answer sheet.
NB You may use any letter more than once.

14 bad outcomes for a forest when people focus only on its financial reward
15 reference to the aspects of any tree that contribute to its worth
16 mention of the potential use of wood to help run vehicles
17 examples of insects that attack trees
18 an alternative name for trees that produce low-use wood

Questions 19–21
Look at the following purposes (Questions 19–21) and the list of timber cuts below.
Match each purpose with the correct timber cut, A, B or C.
Write the correct letter, A, B or C, in boxes 19–21 on your answer sheet.
NB You may use any letter more than once.

List of Timber Cuts
A a TSI Cut
B a Salvage Cut
C a Shelterwood Cut

19 to remove trees that are diseased
20 to generate income across a number of years
21 to create a forest whose trees are close in age

Questions 22–26
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 22–26 on your answer sheet.

22 Some dead wood is removed to avoid the possibility of 22 ............... .
23 The 23 ............... from the tops of cut trees can help improve soil quality.
24 Some damaged trees should be left, as their 24 ............... provide habitats for a range of creatures.
25 Some trees that are small, such as 25 ............... , are a source of food for animals and insects.
26 Any trees that are 26 ............... should be left to grow, as they add to the variety of species in the forest."""

    cuts_opts = [
        {"label": "A", "text": "a TSI Cut"},
        {"label": "B", "text": "a Salvage Cut"},
        {"label": "C", "text": "a Shelterwood Cut"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MATCHING", "content": {"stem": "bad outcomes for a forest when people focus only on its financial reward", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}, {"label": "F", "text": "Paragraph F"}, {"label": "G", "text": "Paragraph G"}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MATCHING", "content": {"stem": "reference to the aspects of any tree that contribute to its worth", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}, {"label": "F", "text": "Paragraph F"}, {"label": "G", "text": "Paragraph G"}]}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "mention of the potential use of wood to help run vehicles", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}, {"label": "F", "text": "Paragraph F"}, {"label": "G", "text": "Paragraph G"}]}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "examples of insects that attack trees", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}, {"label": "F", "text": "Paragraph F"}, {"label": "G", "text": "Paragraph G"}]}, "correctAnswer": "E"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "an alternative name for trees that produce low-use wood", "options": [{"label": "A", "text": "Paragraph A"}, {"label": "B", "text": "Paragraph B"}, {"label": "C", "text": "Paragraph C"}, {"label": "D", "text": "Paragraph D"}, {"label": "E", "text": "Paragraph E"}, {"label": "F", "text": "Paragraph F"}, {"label": "G", "text": "Paragraph G"}]}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "to remove trees that are diseased", "options": cuts_opts}, "correctAnswer": "B"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "to generate income across a number of years", "options": cuts_opts}, "correctAnswer": "C"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "to create a forest whose trees are close in age", "options": cuts_opts}, "correctAnswer": "C"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "Some dead wood is removed to avoid the possibility of 22 ________ .", "blank": True}, "correctAnswer": "fire"},
        {"number": 23, "order": 22, "type": "GAP_FILL", "content": {"stem": "The 23 ________ from the tops of cut trees can help improve soil quality.", "blank": True}, "correctAnswer": "nutrients"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "Some damaged trees should be left, as their 24 ________ provide habitats for a range of creatures.", "blank": True}, "correctAnswer": "cavities"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "Some trees that are small, such as 25 ________ , are a source of food for animals and insects.", "blank": True}, "correctAnswer": "hawthorn"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "Any trees that are 26 ________ should be left to grow, as they add to the variety of species in the forest.", "blank": True}, "correctAnswer": "rare"},
    ]

    p3_text = """Conquering Earth's space junk problem

Satellites, rocket shards and collision debris are creating major traffic risks in orbit around the planet. Researchers are working to reduce these threats

A Last year, commercial companies, military and civil departments and amateurs sent more than 400 satellites into orbit, over four times the yearly average in the previous decade. Numbers could rise even more sharply if leading space companies follow through on plans to deploy hundreds to thousands of large constellations of satellites to space in the next few years.
All that traffic can lead to disaster. Ten years ago, a US commercial Iridium satellite smashed into an inactive Russian communications satellite called Cosmos-2251, creating thousands of new pieces of space shrapnel that now threaten other satellites in low Earth orbit – the zone stretching up to 2,000 kilometres in altitude. Altogether, there are roughly 20,000 human-made objects in orbit, from working satellites to small rocket pieces. And satellite operators can't steer away from every potential crash, because each move consumes time and fuel that could otherwise be used for the spacecraft's main job.

B Concern about space junk goes back to the beginning of the satellite era, but the number of objects in orbit is rising so rapidly that researchers are investigating new ways of attacking the problem. Several teams are trying to improve methods for assessing what is in orbit, so that satellite operators can work more efficiently in ever-more-crowded space. Some researchers are now starting to compile a massive data set that includes the best possible information on where everything is in orbit. Others are developing taxonomies of space debris – working on measuring properties such as the shape and size of an object, so that satellite operators know how much to worry about what's coming their way.
The alternative, many say, is unthinkable. Just a few uncontrolled space crashes could generate enough debris to set off a runaway cascade of fragments, rendering near-Earth space unusable. 'If we go on like this, we will reach a point of no return,' says Carolin Frueh, an astrodynamical researcher at Purdue University in West Lafayette, Indiana.

C Even as our ability to monitor space objects increases, so too does the total number of items in orbit. That means companies, governments and other players in space are collaborating in new ways to avoid a shared threat. International groups such as the Inter-Agency Space Debris Coordination Committee have developed guidelines on space sustainability. Those include inactivating satellites at the end of their useful life by venting pressurised materials or leftover fuel that might lead to explosions. The intergovernmental groups also advise lowering satellites deep enough into the atmosphere that they will burn up or disintegrate within 25 years. But so far, only about half of all missions have abided by this 25-year goal, says Holger Krag, head of the European Space Agency's space-debris office in Darmstadt, Germany. Operators of the planned large constellations of satellites say they will be responsible stewards in their enterprises in space, but Krag worries that problems could increase, despite their best intentions. 'What happens to those that fail or go bankrupt?' he asks. 'They are probably not going to spend money to remove their satellites from space.'

D In theory, given the vastness of space, satellite operators should have plenty of room for all these missions to fly safely without ever nearing another object. So some scientists are tackling the problem of space junk by trying to find out where all the debris is to a high degree of precision. That would alleviate the need for many of the unnecessary manoeuvres that are carried out to avoid potential collisions. 'If you knew precisely where everything was, you would almost never have a problem,' says Marlon Sorge, a space-debris specialist at the Aerospace Corporation in El Segundo, California.

E The field is called space traffic management, because it's similar to managing traffic on the roads or in the air. Think about a busy day at an airport, says Moriba Jah, an astrodynamicist at the University of Texas at Austin: planes line up in the sky, landing and taking off close to one another in a carefully choreographed routine. Air-traffic controllers know the location of the planes down to one metre in accuracy. The same can't be said for space debris. Not all objects in orbit are known, and even those included in databases are not tracked consistently.

F An additional problem is that there is no authoritative catalogue that accurately lists the orbits of all known space debris. Jah illustrates this with a web-based database that he has developed. It draws on several sources, such as catalogues maintained by the US and Russian governments, to visualise where objects are in space. When he types in an identifier for a particular space object, the database draws a purple line to designate its orbit. Only this doesn't quite work for a number of objects, such as a Russian rocket body designated in the database as object number 32280. When Jah enters that number, the database draws two purple lines: the US and Russian sources contain two completely different orbits for the same object. Jah says that it is almost impossible to tell which is correct, unless a third source of information made it possible to cross-correlate.
Jah describes himself as a space environmentalist: 'I want to make space a place that is safe to operate, that is free and useful for generations to come.' Until that happens, he argues, the space community will continue devolving into a tragedy in which all spaceflight operators are polluting a common resource."""

    p3_q_content = """Questions 27–31
Reading Passage 3 has six sections, A–F.
Which section contains the following information?
Write the correct letter, A–F, in boxes 27–31 on your answer sheet.

27 a reference to the cooperation that takes place to try and minimise risk
28 an explanation of a person's aims
29 a description of a major collision that occurred in space
30 a comparison between tracking objects in space and the efficiency of a transportation system
31 a reference to efforts to classify space junk

Questions 32–35
Complete the summary below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 32–35 on your answer sheet.

The Inter-Agency Space Debris Coordination Committee
The committee gives advice on how the 32 ............... of space can be achieved. The committee advises that when satellites are no longer active, any unused 33 ............... or pressurised material that could cause 34 ............... should be removed.
Although operators of large satellite constellations accept that they have obligations as stewards of space, Holger Krag points out that the operators that become 35 ............... are unlikely to prioritise removing their satellites from space.

Questions 36–40
Look at the following statements (Questions 36–40) and the list of people below.
Match each statement with the correct person, A, B, C or D.
Write the correct letter, A, B, C or D, in boxes 36–40 on your answer sheet.
NB You may use any letter more than once.

List of People
A Carolin Frueh
B Holger Krag
C Marlon Sorge
D Moriba Jah

36 Knowing the exact location of space junk would help prevent any possible danger.
37 Space should be available to everyone and should be preserved for the future.
38 A recommendation regarding satellites is widely ignored.
39 There is conflicting information about where some satellites are in space.
40 There is a risk we will not be able to undo the damage that occurs in space."""

    people_opts = [
        {"label": "A", "text": "Carolin Frueh"},
        {"label": "B", "text": "Holger Krag"},
        {"label": "C", "text": "Marlon Sorge"},
        {"label": "D", "text": "Moriba Jah"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "a reference to the cooperation that takes place to try and minimise risk", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}]}, "correctAnswer": "C"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "an explanation of a person's aims", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}]}, "correctAnswer": "F"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "a description of a major collision that occurred in space", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}]}, "correctAnswer": "A"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "a comparison between tracking objects in space and the efficiency of a transportation system", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}]}, "correctAnswer": "E"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "a reference to efforts to classify space junk", "options": [{"label": "A", "text": "Section A"}, {"label": "B", "text": "Section B"}, {"label": "C", "text": "Section C"}, {"label": "D", "text": "Section D"}, {"label": "E", "text": "Section E"}, {"label": "F", "text": "Section F"}]}, "correctAnswer": "B"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "The committee gives advice on how the 32 ________ of space can be achieved.", "blank": True}, "correctAnswer": "sustainability"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "The committee advises that when satellites are no longer active, any unused 33 ________ or pressurised material that could cause explosions should be removed.", "blank": True}, "correctAnswer": "fuel"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "any unused fuel or pressurised material that could cause 34 ________ should be removed.", "blank": True}, "correctAnswer": "explosions"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "Holger Krag points out that the operators that become 35 ________ are unlikely to prioritise removing their satellites from space.", "blank": True}, "correctAnswer": "bankrupt"},
        {"number": 36, "order": 35, "type": "MATCHING", "content": {"stem": "Knowing the exact location of space junk would help prevent any possible danger.", "options": people_opts}, "correctAnswer": "C"},
        {"number": 37, "order": 36, "type": "MATCHING", "content": {"stem": "Space should be available to everyone and should be preserved for the future.", "options": people_opts}, "correctAnswer": "D"},
        {"number": 38, "order": 37, "type": "MATCHING", "content": {"stem": "A recommendation regarding satellites is widely ignored.", "options": people_opts}, "correctAnswer": "B"},
        {"number": 39, "order": 38, "type": "MATCHING", "content": {"stem": "There is conflicting information about where some satellites are in space.", "options": people_opts}, "correctAnswer": "D"},
        {"number": 40, "order": 39, "type": "MATCHING", "content": {"stem": "There is a risk we will not be able to undo the damage that occurs in space.", "options": people_opts}, "correctAnswer": "A"},
    ]

    t31_reading = {
        "title": "Test 31.C18.01 - Reading",
        "slug": "test-31-reading",
        "skill": "READING",
        "status": "DRAFT",
        "parts": [
            {"title": "Reading Passage 1", "content": f"{p1_text}\n\n{p1_q_content}", "questions": p1_questions},
            {"title": "Reading Passage 2", "content": f"{p2_text}\n\n{p2_q_content}", "questions": p2_questions},
            {"title": "Reading Passage 3", "content": f"{p3_text}\n\n{p3_q_content}", "questions": p3_questions},
        ]
    }

    return [t31_listening, t31_reading]
