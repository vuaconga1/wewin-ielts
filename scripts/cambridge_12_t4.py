# Test 30: Cambridge 12 Test 4 (Test 30.C12.04)
import json
import os

def get_test_30():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Cycle tour leader: Applicant enquiry
Example
Name: Margaret Smith

About the applicant:
• wants a 1 ............... job
• will soon start work as a 2 ...............
• has led cycle trips in 3 ...............
• interested in being a leader of a cycling trip for families
• is currently doing voluntary work with members of a 4 ............... club
• available for five months from the 1st of 5 ...............
• can't eat 6 ...............

Contact details:
• address: 27 7 ............... Place, Dumfries
• postcode: 8 ...............

Interview:
• interview at 2.30 pm on 9 ...............
• will plan a short 10 ............... about being a tour guide"""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "wants a ________ job", "blank": True}, "correctAnswer": "temporary"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "will soon start work as a ________", "blank": True}, "correctAnswer": "doctor"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "has led cycle trips in ________", "blank": True}, "correctAnswer": "Africa"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "is currently doing voluntary work with members of a ________ club", "blank": True}, "correctAnswer": "youth"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "available for five months from the 1st of ________", "blank": True}, "correctAnswer": "May"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "can't eat ________", "blank": True}, "correctAnswer": "cheese"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "address: 27 ________ Place, Dumfries", "blank": True}, "correctAnswer": "Arbuthnot"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "postcode: ________", "blank": True}, "correctAnswer": "DG7 4PH"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "interview at 2.30 pm on ________", "blank": True}, "correctAnswer": "Tuesday"},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "will plan a short ________ about being a tour guide", "blank": True}, "correctAnswer": "talk", "acceptableAnswers": ["talk", "presentation"]},
    ]

    s2_content = """Questions 11–14
Choose the correct letter, A, B or C.

Visiting the Sheepmarket area
11 Which is the most rapidly-growing group of residents in the Sheepmarket area?
A young professional people
B students from the university
C employees in the local market

12 The speaker recommends the side streets in the Sheepmarket for their
A international restaurants.
B historical buildings.
C arts and crafts.

13 Clothes designed by entrants for the Young Fashion competition must
A be modelled by the designers themselves.
B be inspired by aspects of contemporary culture.
C be made from locally produced materials.

14 Car parking is free in some car parks if you
A stay for less than an hour.
B buy something in the shops.
C park in the evenings or at weekends.

Questions 15–20
Label the map below.
Write the correct letter, A–I, next to Questions 15–20.

Art and History in the Sheepmarket"""

    map_options = [
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
    map_image = "/uploads/images/test-30-map.png"
    map_content = lambda stem: {
        "stem": stem,
        "options": map_options,
        "imageUrl": map_image,
        "blank": True,
        "variant": "MAP_LABELING",
    }

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which is the most rapidly-growing group of residents in the Sheepmarket area?", "options": [{"label": "A", "text": "young professional people"}, {"label": "B", "text": "students from the university"}, {"label": "C", "text": "employees in the local market"}]}, "correctAnswer": "A"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "The speaker recommends the side streets in the Sheepmarket for their", "options": [{"label": "A", "text": "international restaurants."}, {"label": "B", "text": "historical buildings."}, {"label": "C", "text": "arts and crafts."}]}, "correctAnswer": "C"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "Clothes designed by entrants for the Young Fashion competition must", "options": [{"label": "A", "text": "be modelled by the designers themselves."}, {"label": "B", "text": "be inspired by aspects of contemporary culture."}, {"label": "C", "text": "be made from locally produced materials."}]}, "correctAnswer": "B"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Car parking is free in some car parks if you", "options": [{"label": "A", "text": "stay for less than an hour."}, {"label": "B", "text": "buy something in the shops."}, {"label": "C", "text": "park in the evenings or at weekends."}]}, "correctAnswer": "B"},
        {"number": 15, "order": 14, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("The Reynolds House"), "correctAnswer": "H"},
        {"number": 16, "order": 15, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("The Thumb"), "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("The Museum"), "correctAnswer": "F"},
        {"number": 18, "order": 17, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("The Contemporary Art Gallery"), "correctAnswer": "G"},
        {"number": 19, "order": 18, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("The Warner Gallery"), "correctAnswer": "I"},
        {"number": 20, "order": 19, "type": "MAP_LABELING", "mediaUrl": map_image, "content": map_content("Nucleus"), "correctAnswer": "B"},
    ]

    s3_content = """Questions 21–24
Complete the table below.
Write ONE WORD ONLY for each answer.

Presentation on film adaptations of Shakespeare's plays
Stages of presentation | Work still to be done
Introduce Giannetti's book containing a 21 ............... of adaptations | Organise notes
Ask class to suggest the 22 ............... adaptations | No further work needed
Present Rachel Malchow's ideas | Prepare some 23 ...............
Discuss relationship between adaptations and 24 ............... at the time of making the film | No further work needed

Questions 25–30
What do the speakers say about each of the following films?
Choose SIX answers from the box and write the correct letter, A–G, next to Questions 25–30.

Comments
A clearly shows the historical period
B contains only parts of the play
C is too similar to another kind of film
D turned out to be unpopular with audiences
E presents the play in a different period from the original
F sets the original in a different country
G incorporates a variety of art forms

Films
25 Ran
26 Much Ado About Nothing
27 Romeo & Juliet
28 Hamlet
29 Prospero's Books
30 Looking for Richard"""

    film_opts = [
        {"label": "A", "text": "clearly shows the historical period"},
        {"label": "B", "text": "contains only parts of the play"},
        {"label": "C", "text": "is too similar to another kind of film"},
        {"label": "D", "text": "turned out to be unpopular with audiences"},
        {"label": "E", "text": "presents the play in a different period from the original"},
        {"label": "F", "text": "sets the original in a different country"},
        {"label": "G", "text": "incorporates a variety of art forms"},
    ]

    s3_questions = [
        {"number": 21, "order": 20, "type": "GAP_FILL", "content": {"stem": "Introduce Giannetti's book containing a ________ of adaptations", "blank": True}, "correctAnswer": "classification"},
        {"number": 22, "order": 21, "type": "GAP_FILL", "content": {"stem": "Ask class to suggest the ________ adaptations", "blank": True}, "correctAnswer": "worst"},
        {"number": 23, "order": 22, "type": "GAP_FILL", "content": {"stem": "Present Rachel Malchow's ideas - Prepare some ________", "blank": True}, "correctAnswer": "slides"},
        {"number": 24, "order": 23, "type": "GAP_FILL", "content": {"stem": "Discuss relationship between adaptations and ________ at the time of making the film", "blank": True}, "correctAnswer": "issues"},
        {"number": 25, "order": 24, "type": "MATCHING", "content": {"stem": "Ran", "options": film_opts}, "correctAnswer": "F"},
        {"number": 26, "order": 25, "type": "MATCHING", "content": {"stem": "Much Ado About Nothing", "options": film_opts}, "correctAnswer": "A"},
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Romeo & Juliet", "options": film_opts}, "correctAnswer": "E"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Hamlet", "options": film_opts}, "correctAnswer": "C"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Prospero's Books", "options": film_opts}, "correctAnswer": "G"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Looking for Richard", "options": film_opts}, "correctAnswer": "B"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Noise in Cities

Past research
• focused on noise level (measured in decibels) and people's responses.

Noise 'maps'
• show that the highest noise levels are usually found on roads
• do not show other sources of noise, e.g. when windows are open or people's neighbours are in their 31 ...............
• ignore variations in people's perceptions of noise
• have made people realize that the noise is a 32 ............... issue that must be dealt with

Problems caused by noise
• sleep disturbance
• increase in amount of stress
• effect on the 33 ............... of schoolchildren

Different types of noise
• Some noises can be considered pleasant e.g. the sound of a 34 ............... in a town
• To investigate this, researchers may use methods from 35 ............... sciences e.g. questionnaires

What people want
• Plenty of activity in urban environments which are 36 ...............
• allow people to relax
• But architects and town planners do not get much 37 ............... in acoustics
• regard sound as the responsibility of engineers

Understanding sound as an art form
• We need to know how sound relates to 38 ...............
• what can be learnt from psychology about the effects of sound
• but also whether physics can help us understand the 39 ............... of sound

Virtual reality programs
• advantage: predict the effect of buildings
• current disadvantage: they are 40 ..............."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "e.g. when windows are open or people's neighbours are in their ________", "blank": True}, "correctAnswer": "garden", "acceptableAnswers": ["garden", "gardens"]},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "have made people realize that the noise is a ________ issue that must be dealt with", "blank": True}, "correctAnswer": "political"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "effect on the ________ of schoolchildren", "blank": True}, "correctAnswer": "work", "acceptableAnswers": ["work", "study", "work/study"]},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "e.g. the sound of a ________ in a town", "blank": True}, "correctAnswer": "fountain"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "researchers may use methods from ________ sciences e.g. questionnaires", "blank": True}, "correctAnswer": "social"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "Plenty of activity in urban environments which are ________", "blank": True}, "correctAnswer": "lively"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "architects and town planners do not get much ________ in acoustics", "blank": True}, "correctAnswer": "training"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "We need to know how sound relates to ________", "blank": True}, "correctAnswer": "culture"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "whether physics can help us understand the ________ of sound", "blank": True}, "correctAnswer": "nature"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "advantage: predict the effect of buildings; current disadvantage: they are ________", "blank": True}, "correctAnswer": "silent"},
    ]

    listening_draft = {
        "title": "Test 30.C12.04 - Listening",
        "slug": "test-30-listening",
        "skill": "LISTENING",
        "examType": "ACADEMIC",
        "timeLimitMinutes": 40,
        "tags": ["#IELTS Academic", "#Listening"],
        "parts": [
            {"title": "Section 1", "order": 0, "audioUrl": "/uploads/audio/test-30-section-1.mp3", "content": s1_content, "questions": s1_questions},
            {
                "title": "Section 2",
                "order": 1,
                "audioUrl": "/uploads/audio/test-30-section-2.mp3",
                "imageUrl": map_image,
                "content": s2_content,
                "questions": s2_questions,
            },
            {"title": "Section 3", "order": 2, "audioUrl": "/uploads/audio/test-30-section-3.mp3", "content": s3_content, "questions": s3_questions},
            {"title": "Section 4", "order": 3, "audioUrl": "/uploads/audio/test-30-section-4.mp3", "content": s4_content, "questions": s4_questions},
        ]
    }

    # ==================== READING ====================
    p1_content = """READING PASSAGE 1
You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.

The History of Glass

From our earliest origins, man has been making use of glass. Historians have discovered that a type of natural glass – obsidian – formed in places such as the mouth of a volcano as a result of the intense heat of an eruption melting rocks, was used by man to make tools and weapons. Archaeologists have even found glass articles which date back to 4000 BC; this took the form of glazes used for coating stone beads. It was not until 1500 BC, however, that the first hollow glass container was made by covering a sand core with a layer of molten glass.

Glass blowing became the most common way to make glass containers from the first century BC. The glass made during this time was highly coloured due to the impurities of the raw material. In the first century AD, methods of creating colourless glass were developed, which was then tinted by the addition of colouring materials. The secret of glass making was taken across Europe by the Romans during this century. However, they guarded the skills and technology required to make glass very closely, and it was not until their empire collapsed in 476 AD that glass-making knowledge became widespread throughout Europe and the Middle East. From the 10th century onwards, the Venetians gained a reputation for technical skill and artistic ability in the making of glass bottles, and many of the city's craftsmen left Italy to set up glassworks throughout Europe.

A major milestone in the history of glass occurred with the invention of lead crystal glass by the English glass manufacturer George Ravenscroft (1632–1683). He countered the clouding that sometimes occurred in blown glass by introducing lead to the raw materials used in the process. The new glass he created was softer and easier to decorate, and had a higher refractive index, adding to its brilliance and beauty, and it proved invaluable to the optical industry. It is thanks to Ravenscroft's invention that optical lenses, astronomical telescopes, microscopes and the like became possible.

In Britain, the modern glass industry only really started to develop after the repeal of the Excise Act in 1845. Before that time, heavy taxes had been placed on the amount of glass melted in a glasshouse, and were levied continuously from 1745 to 1845. Joseph Paxton's Crystal Palace at London's Great Exhibition of 1851 marked the beginning of glass as a material used in the building industry. This revolutionary new building encouraged the use of glass in public, domestic and horticultural architecture. Glass manufacturing techniques also improved with the advancement of science and the development of better technology.

From 1887 onwards, glass making developed from traditional mouth-blowing to a semi-automatic process, after factory-owner HM Ashley introduced a machine capable of producing 200 bottles per hour in Castleford, Yorkshire, England – more than three times quicker than any previous production method. Then in 1907, the first fully automated machine was developed in the USA by Michael Owens – founder of the Owens Bottle Machine Company (later the major manufacturers Owens-Illinois) – and installed in its factory. Owens' invention could produce an impressive 2,500 bottles an hour. Other developments followed rapidly, but it was not until the First World War, when Britain became cut off from essential glass suppliers, that glass recycling first became popular. Before then, glass had been seen as a craft rather than a precise science.

Today, glass making is big business. It has become a modern, hi-tech industry operating in a fiercely competitive global market where quality, design and service levels are critical to maintaining market share. Modern glass plants are capable of making millions of glass containers a day in many different colours, with green, brown and clear remaining the most popular.

Few of us can imagine modern life without glass. It features in almost every aspect of our lives – in our homes, our cars and whenever we sit down to eat or drink. Glass packaging is used for many products, many beverages are sold in glass, as are numerous foodstuffs, as well as medicines and cosmetics.

Glass is an ideal material for recycling, and with growing consumer concern for the environment, glass recycling has become big business. It saves used glass containers being sent to landfill. As less energy is needed to melt recycled glass than to melt down raw materials, this also saves fuel and production costs. Recycling also reduces the need for raw materials to be quarried, thus saving precious resources.

Questions 1–8
Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 1–8 on your answer sheet.

The History of Glass
• Early humans used a material called 1 ............... to make the sharp points of their 2 ............... .
• 4000 BC: 3 ............... made of stone were covered in a coating of man-made glass.
• First century BC: glass was coloured because of the 4 ............... in the material.
• Until 476 AD: Only the 5 ............... knew how to make glass.
• From 10th century: Venetians became famous for making bottles out of glass.
• 17th century: George Ravenscroft developed a process using 6 ............... to avoid the occurrence of 7 ............... in blown glass.
• Mid-19th century: British glass production developed after changes to laws concerning 8 ............... .

Questions 9–13
Do the following statements agree with the information given in Reading Passage 1?
In boxes 9–13 on your answer sheet, write
TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

9 In 1887, HM Ashley had the fastest bottle-producing machine that existed at the time.
10 Michael Owens was hired by a large US company to design a fully-automated bottle manufacturing machine for them.
11 Nowadays, most glass is produced by large international manufacturers.
12 Concern for the environment is leading to an increased demand for glass containers.
13 It is more expensive to produce recycled glass than to manufacture new glass."""

    tfng_opts = [
        {"label": "TRUE", "text": "TRUE"},
        {"label": "FALSE", "text": "FALSE"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"},
    ]

    p1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Early humans used a material called ________ to make the sharp points", "blank": True}, "correctAnswer": "obsidian"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "to make the sharp points of their ________ .", "blank": True}, "correctAnswer": "spears"},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "4000 BC: ________ made of stone were covered in a coating of man-made glass.", "blank": True}, "correctAnswer": "beads"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "First century BC: glass was coloured because of the ________ in the material.", "blank": True}, "correctAnswer": "impurities"},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "Until 476 AD: Only the ________ knew how to make glass.", "blank": True}, "correctAnswer": "Romans"},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "17th century: George Ravenscroft developed a process using ________", "blank": True}, "correctAnswer": "lead"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "to avoid the occurrence of ________ in blown glass.", "blank": True}, "correctAnswer": "clouding"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "Mid-19th century: British glass production developed after changes to laws concerning ________ .", "blank": True}, "correctAnswer": "taxes"},
        {"number": 9, "order": 8, "type": "TRUE_FALSE_NG", "content": {"stem": "In 1887, HM Ashley had the fastest bottle-producing machine that existed at the time.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 10, "order": 9, "type": "TRUE_FALSE_NG", "content": {"stem": "Michael Owens was hired by a large US company to design a fully-automated bottle manufacturing machine for them.", "options": tfng_opts}, "correctAnswer": "FALSE"},
        {"number": 11, "order": 10, "type": "TRUE_FALSE_NG", "content": {"stem": "Nowadays, most glass is produced by large international manufacturers.", "options": tfng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 12, "order": 11, "type": "TRUE_FALSE_NG", "content": {"stem": "Concern for the environment is leading to an increased demand for glass containers.", "options": tfng_opts}, "correctAnswer": "TRUE"},
        {"number": 13, "order": 12, "type": "TRUE_FALSE_NG", "content": {"stem": "It is more expensive to produce recycled glass than to manufacture new glass.", "options": tfng_opts}, "correctAnswer": "FALSE"},
    ]

    p2_content = """READING PASSAGE 2
You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.

Bring back the big cats
It's time to start returning vanished native animals to Britain, says John Vesty

There is a poem, written around 598 AD, which describes hunting a mystery animal called a llewyn. But what was it? Nothing seemed to fit, until 2006, when an animal bone, dating from around the same period, was found in the Kinsey Cave in northern England. Until this discovery, the lynx – a large spotted cat with tasselled ears – was presumed to have died out in Britain at least 6,000 years ago, before the inhabitants of these islands took up farming. But the 2006 find, together with three others in Yorkshire and Scotland, is compelling evidence that the lynx and the mysterious llewyn were in fact one and the same animal. If this is so, it would bring forward the tassel-eared cat's estimated extinction date by roughly 5,000 years.

However, this is not quite the last glimpse of the animal in British culture. A 9th-century stone cross from the Isle of Eigg shows, alongside the deer, boar and aurochs pursued by a mounted hunter, a speckled cat with tasselled ears. Were it not for the animal's backside having worn away with time, we could have been certain, as the lynx's stubby tail is unmistakable. But even without this key feature, it's hard to see what else the creature could have been. The lynx is now becoming the totemic animal of a movement that is transforming British environmentalism: rewilding.

Rewilding means the mass restoration of damaged ecosystems. It involves letting trees return to places that have been denuded, allowing parts of the seabed to recover from trawling and dredging, permitting rivers to flow freely again. Above all, it means bringing back missing species. One of the most striking findings of modern ecology is that ecosystems without large predators behave in completely different ways from those that have them. Large predators drive dynamic processes that resonate through the whole food chain, creating niches for hundreds of species that might otherwise struggle to survive. The killers turn out to be bringers of life.

Such findings present a big challenge to British conservation, which has often selected arbitrary assemblages of plants and animals and sought, at great effort and expense, to prevent them from changing. It has tried to preserve the living world as if it were a jar of pickles, letting nothing in and nothing out, keeping nature in a state of arrested development. But ecosystems are not merely collections of species; they are also the dynamic and ever-shifting relationships between them. And this dynamism often depends on large predators.

At sea the potential is even greater: by protecting large areas from commercial fishing, we could once more see what 18th-century literature describes: vast shoals of fish being chased by fin and sperm whales, within sight of the English shore. This policy would also greatly boost catches in the surrounding seas; the fishing industry's insistence on scouring every inch of seabed, leaving no breeding reserves, could not be more damaging to its own interests.

Rewilding is a rare example of an environmental movement in which campaigners articulate what they are for rather than only what they are against. One of the reasons why the enthusiasm for rewilding is spreading so quickly in Britain is that it helps to create a more inspiring vision than the green movement's usual promise of 'Follow us and the world will be slightly less awful than it would otherwise have been'.

The lynx presents no threat to human beings: there is no known instance of one preying on people. It is a specialist predator of roe deer, a species that has exploded in Britain in recent decades, holding back, by intensive browsing, attempts to re-establish forests. It will also winkle out sika deer: an exotic species that is almost impossible for human beings to control, as it hides in impenetrable plantations of young trees. The attempt to reintroduce this predator marries well with the aim of bringing forests back to parts of our bare and barren uplands. The lynx requires deep cover, and as such presents little risk to sheep and other livestock, which are supposed, as a condition of farm subsidies, to be kept out of the woods.

On a recent trip to the Cairngorm Mountains, I heard several conservationists suggest that the lynx could be reintroduced there within 20 years. If trees return to the bare hills elsewhere in Britain, the big cats could soon follow. There is nothing extraordinary about these proposals. The lynx has already been reintroduced to the Jura Mountains, the Alps, the Vosges in France, and the Harz Mountains in Germany, and is slowly repopulating the Scandinavian peninsula.

The European lynx population has tripled since 1970 to roughly 10,000. As with the wolf, bear and beaver, the lynx has returned to these places, often without introducing conflict, because of the abandonment of marginal agricultural land and the regrowth of forests. In many parts of Europe, conservationists have come to understand that preserving species requires restoring ecological processes. It is time we did the same in Britain.

Questions 14–18
Choose the correct letter, A, B, C or D.
Write the correct letter in boxes 14–18 on your answer sheet.

14 What did the 2006 discovery of the animal bone reveal about the lynx?
A Its physical appearance was very distinctive.
B Its extinction was linked to the spread of farming.
C It vanished from Britain several thousand years ago.
D It survived in Britain longer than was previously thought.

15 What point does the writer make about large predators in the third paragraph?
A Their presence can increase biodiversity.
B They may cause damage to local ecosystems.
C Their behaviour can alter according to the environment.
D They should be reintroduced only to areas where they were native.

16 What does the writer suggest about British conservation in the fourth paragraph?
A It has failed to achieve its aims.
B It is beginning to change direction.
C It has taken a misguided approach.
D It has focused on the most widespread species.

17 Protecting large areas of the sea from commercial fishing would result in
A practical benefits for the fishing industry.
B some short-term losses to the fishing industry.
C widespread opposition from the fishing industry.
D certain changes to techniques within the fishing industry.

18 According to the author, what distinguishes rewilding from other environmental campaigns?
A Its objective is more achievable.
B Its supporters are more articulate.
C Its positive message is more appealing.
D It is based on sounder scientific principles.

Questions 19–22
Complete the summary using the list of words and phrases, A–F, below.
Write the correct letter, A–F, in boxes 19–22 on your answer sheet.

Reintroducing the lynx to Britain
There would be many advantages to reintroducing the lynx to Britain. While there is no evidence that the lynx has ever put 19 ............... in danger, it would reduce the numbers of certain 20 ............... whose populations have increased enormously in recent decades. It would present only a minimal threat to 21 ............... provided these were kept away from lynx habitats. Furthermore, the reintroduction programme would also link efficiently with initiatives to return native 22 ............... to certain areas of the country.

A trees
B endangered species
C hillsides
D wild animals
E humans
F farm animals

Questions 23–26
Do the following statements agree with the claims of the writer in Reading Passage 2?
In boxes 23–26 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

23 Britain could become the first European country to reintroduce the lynx.
24 The large growth in the European lynx population since 1970 has exceeded conservationists' expectations.
25 Changes in agricultural practices have extended the habitat of the lynx in Europe.
26 It has become apparent that species reintroduction has commercial advantages."""

    lynx_summary_opts = [
        {"label": "A", "text": "trees"},
        {"label": "B", "text": "endangered species"},
        {"label": "C", "text": "hillsides"},
        {"label": "D", "text": "wild animals"},
        {"label": "E", "text": "humans"},
        {"label": "F", "text": "farm animals"},
    ]

    ynng_opts = [
        {"label": "YES", "text": "YES"},
        {"label": "NO", "text": "NO"},
        {"label": "NOT GIVEN", "text": "NOT GIVEN"},
    ]

    p2_questions = [
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "What did the 2006 discovery of the animal bone reveal about the lynx?", "options": [{"label": "A", "text": "Its physical appearance was very distinctive."}, {"label": "B", "text": "Its extinction was linked to the spread of farming."}, {"label": "C", "text": "It vanished from Britain several thousand years ago."}, {"label": "D", "text": "It survived in Britain longer than was previously thought."}]}, "correctAnswer": "D"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What point does the writer make about large predators in the third paragraph?", "options": [{"label": "A", "text": "Their presence can increase biodiversity."}, {"label": "B", "text": "They may cause damage to local ecosystems."}, {"label": "C", "text": "Their behaviour can alter according to the environment."}, {"label": "D", "text": "They should be reintroduced only to areas where they were native."}]}, "correctAnswer": "A"},
        {"number": 16, "order": 15, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the writer suggest about British conservation in the fourth paragraph?", "options": [{"label": "A", "text": "It has failed to achieve its aims."}, {"label": "B", "text": "It is beginning to change direction."}, {"label": "C", "text": "It has taken a misguided approach."}, {"label": "D", "text": "It has focused on the most widespread species."}]}, "correctAnswer": "C"},
        {"number": 17, "order": 16, "type": "MULTIPLE_CHOICE", "content": {"stem": "Protecting large areas of the sea from commercial fishing would result in", "options": [{"label": "A", "text": "practical benefits for the fishing industry."}, {"label": "B", "text": "some short-term losses to the fishing industry."}, {"label": "C", "text": "widespread opposition from the fishing industry."}, {"label": "D", "text": "certain changes to techniques within the fishing industry."}]}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MULTIPLE_CHOICE", "content": {"stem": "According to the author, what distinguishes rewilding from other environmental campaigns?", "options": [{"label": "A", "text": "Its objective is more achievable."}, {"label": "B", "text": "Its supporters are more articulate."}, {"label": "C", "text": "Its positive message is more appealing."}, {"label": "D", "text": "It is based on sounder scientific principles."}]}, "correctAnswer": "C"},
        {"number": 19, "order": 18, "type": "MATCHING", "content": {"stem": "While there is no evidence that the lynx has ever put 19 in danger,", "options": lynx_summary_opts}, "correctAnswer": "E"},
        {"number": 20, "order": 19, "type": "MATCHING", "content": {"stem": "it would reduce the numbers of certain 20 whose populations have increased enormously", "options": lynx_summary_opts}, "correctAnswer": "D"},
        {"number": 21, "order": 20, "type": "MATCHING", "content": {"stem": "It would present only a minimal threat to 21 provided these were kept away", "options": lynx_summary_opts}, "correctAnswer": "F"},
        {"number": 22, "order": 21, "type": "MATCHING", "content": {"stem": "link efficiently with initiatives to return native 22 to certain areas", "options": lynx_summary_opts}, "correctAnswer": "A"},
        {"number": 23, "order": 22, "type": "TRUE_FALSE_NG", "content": {"stem": "Britain could become the first European country to reintroduce the lynx.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 24, "order": 23, "type": "TRUE_FALSE_NG", "content": {"stem": "The large growth in the European lynx population since 1970 has exceeded conservationists' expectations.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 25, "order": 24, "type": "TRUE_FALSE_NG", "content": {"stem": "Changes in agricultural practices have extended the habitat of the lynx in Europe.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 26, "order": 25, "type": "TRUE_FALSE_NG", "content": {"stem": "It has become apparent that species reintroduction has commercial advantages.", "options": ynng_opts}, "correctAnswer": "YES"},
    ]

    p3_content = """READING PASSAGE 3
You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.

UK companies need more effective boards of directors
After a number of serious failures of governance (that is, how they are managed at the highest level), companies in Britain, as well as elsewhere, should consider radical changes to their directors' roles.

A It is clear that the role of a board director today is not an easy one. Following the 2008 financial meltdown, which resulted in a deeper and more prolonged period of economic downturn than anyone expected, the search for explanations in the many post-mortems of the crisis has meant blame has been spread far and wide. Governments, regulators, central banks and auditors have all been in the frame. The role of bank directors and management and their widely publicised failures have been extensively picked over and examined in reports, inquiries and commentaries. The knock-on effect of this scrutiny has been to make the governance of companies in general an issue of intense public debate and has significantly increased the pressures on, and the responsibilities of, directors.

B At the simplest and most practical level, the time involved in fulfilling the demands of a board directorship has increased significantly, calling into question the effectiveness of the classic model of corporate governance by part-time, independent non-executive directors. Where once a board schedule may have consisted of between eight and ten meetings a year, in many companies the number of events requiring board input and decisions has dramatically risen. Furthermore, the amount of reading and preparation required for each meeting is increasing. Agendas can become overloaded and this can mean the time for constructive debate must necessarily be restricted in favour of getting through the business.

C Often, board business is devolved to committees in order to cope with the workload, which may be more efficient but can mean that the board as a whole is less involved in fully addressing some of the most important issues. It is not uncommon for the audit committee meeting to last longer than the main board meeting itself. Process may take the place of discussion and be at the expense of real collaboration, so that boxes are ticked rather than issues tackled.

D A radical solution, which may work for some very large companies whose businesses are extensive and complex, is the professional board, whose members would work up to three or four days a week, supported by their own dedicated staff and advisers. There are obvious risks to this and it would be important to establish clear guidelines for such a board to ensure that it did not step on the toes of management by becoming too engaged in the day-to-day running of the company. Problems of recruitment, remuneration and independence could also arise and this structure would not be appropriate for all companies. However, more professional and better-informed boards would have been particularly appropriate for banks where the executives had access to information that part-time non-executive directors lacked, leaving the latter unable to comprehend or anticipate the 2008 crash.

E One of the main criticisms of boards and their directors is that they do not focus sufficiently on longer-term matters of strategy, sustainability and governance, but instead concentrate too much on short-term financial metrics. Regulatory requirements and the structure of the market encourage this behaviour. The tyranny of quarterly reporting can distort board decision-making, as directors have to 'make the numbers' every four months to meet the insatiable appetite of the market for more data. This serves to encourage the trading methodology of a certain kind of investor who moves in and out of a stock without engaging in constructive dialogue with the company about strategy or performance, and is simply seeking a short-term financial gain. This effect has been made worse by the changing profile of investors due to the globalisation of capital and the increasing use of automated trading systems. Corporate culture adapts and management teams are largely incentivised to meet financial goals.

F Compensation for chief executives has become a combat zone where pitched battles between investors, management and board members are fought, often behind closed doors but increasingly frequently in the full glare of press attention. Many would argue that this is in the interest of transparency and good governance as shareholders use their muscle in the area of pay to pressure boards to remove underperforming chief executives. Their powers to vote down executive remuneration policies increased when binding votes came into force. The chair of the remuneration committee can be an exposed and lonely role, as Alison Carnwath, chair of Barclays Bank's remuneration committee, found when she had to resign, having been roundly criticised for trying to defend the enormous bonus to be paid to the chief executive; the irony being that she was widely understood to have spoken out against it in the privacy of the committee.

G The financial crisis stimulated a debate about the role and purpose of the company and a heightened awareness of corporate ethics. Trust in the corporation has been eroded and academics such as Michael Sandel, in his thoughtful and bestselling book What Money Can't Buy, are questioning the morality of capitalism and the market economy. Boards of companies in all sectors will need to widen their perspective to encompass these issues and this may involve a realignment of corporate goals. We live in challenging times.

Questions 27–33
Reading Passage 3 has seven paragraphs, A–G.
Choose the correct heading for each paragraph from the list of headings below.
Write the correct number, i–viii, in boxes 27–33 on your answer sheet.

List of Headings
i Disputes over financial arrangements regarding senior managers
ii The impact on companies of being subjected to close examination
iii The possible need for fundamental change in every area of business
iv Many external bodies being held responsible for problems
v The falling number of board members with broad enough experience
vi A risk that not all directors take part in solving major problems
vii Boards not looking far enough ahead
viii A proposal to change the way the board operates

27 Paragraph A
28 Paragraph B
29 Paragraph C
30 Paragraph D
31 Paragraph E
32 Paragraph F
33 Paragraph G

Questions 34–37
Do the following statements agree with the claims of the writer in Reading Passage 3?
In boxes 34–37 on your answer sheet, write
YES if the statement agrees with the claims of the writer
NO if the statement contradicts the claims of the writer
NOT GIVEN if it is impossible to say what the writer thinks about this

34 Close scrutiny of the behaviour of boards has increased since the economic downturn.
35 Banks have been mismanaged to a greater extent than other businesses.
36 Board meetings normally continue for as long as necessary to debate matters in full.
37 Using a committee structure would ensure that board members are fully informed about significant issues.

Questions 38–40
Complete the sentences below.
Choose ONE WORD ONLY from the passage for each answer.
Write your answers in boxes 38–40 on your answer sheet.

38 Before 2008, non-executive directors were at a disadvantage because of their lack of ............... .
39 Boards tend to place too much emphasis on considerations that are only of ............... relevance.
40 On certain matters, such as pay, the board may have to accept the views of ............... ."""

    headings_opts_p3 = [
        {"label": "i", "text": "Disputes over financial arrangements regarding senior managers"},
        {"label": "ii", "text": "The impact on companies of being subjected to close examination"},
        {"label": "iii", "text": "The possible need for fundamental change in every area of business"},
        {"label": "iv", "text": "Many external bodies being held responsible for problems"},
        {"label": "v", "text": "The falling number of board members with broad enough experience"},
        {"label": "vi", "text": "A risk that not all directors take part in solving major problems"},
        {"label": "vii", "text": "Boards not looking far enough ahead"},
        {"label": "viii", "text": "A proposal to change the way the board operates"},
    ]

    p3_questions = [
        {"number": 27, "order": 26, "type": "MATCHING", "content": {"stem": "Paragraph A", "options": headings_opts_p3}, "correctAnswer": "iv"},
        {"number": 28, "order": 27, "type": "MATCHING", "content": {"stem": "Paragraph B", "options": headings_opts_p3}, "correctAnswer": "ii"},
        {"number": 29, "order": 28, "type": "MATCHING", "content": {"stem": "Paragraph C", "options": headings_opts_p3}, "correctAnswer": "vi"},
        {"number": 30, "order": 29, "type": "MATCHING", "content": {"stem": "Paragraph D", "options": headings_opts_p3}, "correctAnswer": "viii"},
        {"number": 31, "order": 30, "type": "MATCHING", "content": {"stem": "Paragraph E", "options": headings_opts_p3}, "correctAnswer": "vii"},
        {"number": 32, "order": 31, "type": "MATCHING", "content": {"stem": "Paragraph F", "options": headings_opts_p3}, "correctAnswer": "i"},
        {"number": 33, "order": 32, "type": "MATCHING", "content": {"stem": "Paragraph G", "options": headings_opts_p3}, "correctAnswer": "iii"},
        {"number": 34, "order": 33, "type": "TRUE_FALSE_NG", "content": {"stem": "Close scrutiny of the behaviour of boards has increased since the economic downturn.", "options": ynng_opts}, "correctAnswer": "YES"},
        {"number": 35, "order": 34, "type": "TRUE_FALSE_NG", "content": {"stem": "Banks have been mismanaged to a greater extent than other businesses.", "options": ynng_opts}, "correctAnswer": "NOT GIVEN"},
        {"number": 36, "order": 35, "type": "TRUE_FALSE_NG", "content": {"stem": "Board meetings normally continue for as long as necessary to debate matters in full.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 37, "order": 36, "type": "TRUE_FALSE_NG", "content": {"stem": "Using a committee structure would ensure that board members are fully informed about significant issues.", "options": ynng_opts}, "correctAnswer": "NO"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "Before 2008, non-executive directors were at a disadvantage because of their lack of ________ .", "blank": True}, "correctAnswer": "information"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "Boards tend to place too much emphasis on considerations that are only of ________ relevance.", "blank": True}, "correctAnswer": "financial"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "On certain matters, such as pay, the board may have to accept the views of ________ .", "blank": True}, "correctAnswer": "shareholders", "acceptableAnswers": ["shareholders", "investors", "shareholders/investors"]},
    ]

    reading_draft = {
        "title": "Test 30.C12.04 - Reading",
        "slug": "test-30-reading",
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
