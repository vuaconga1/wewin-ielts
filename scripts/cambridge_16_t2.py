# Test 36: Cambridge 16 Test 2 (Test 36.C16.02)
import json
import os

def get_test_36():
    # ==================== LISTENING ====================
    s1_content = """Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Copying photos to digital format
Name of company: Picturerep

Requirements
• Maximum size of photos is 30 cm, minimum size 4 cm.
• Photos must not be in a 1 ............... or an album.

Cost
• The cost for 360 photos is 2 £ ............... (including one disk).
• Before the completed order is sent, 3 ............... is required.

Services included in the price
• Photos can be placed in a folder, e.g. with the name 4 ............... .
• The 5 ............... and contrast can be improved if necessary.
• Photos which are very fragile will be scanned by 6 ............... .

Special restore service (costs extra)
• It may be possible to remove an object from a photo, or change the 7 ............... .
• A photo which is not correctly in 8 ............... cannot be fixed.

Other information
• Orders are completed within 9 ............... .
• Send the photos in a box (not 10 ...............)."""

    s1_questions = [
        {"number": 1, "order": 0, "type": "GAP_FILL", "content": {"stem": "Photos must not be in a 1 ________ or an album.", "blank": True}, "correctAnswer": "frame"},
        {"number": 2, "order": 1, "type": "GAP_FILL", "content": {"stem": "The cost for 360 photos is 2 £ ________ (including one disk).", "blank": True}, "correctAnswer": "195", "acceptableAnswers": ["195", "£195"]},
        {"number": 3, "order": 2, "type": "GAP_FILL", "content": {"stem": "Before the completed order is sent, 3 ________ is required.", "blank": True}, "correctAnswer": "payment"},
        {"number": 4, "order": 3, "type": "GAP_FILL", "content": {"stem": "Photos can be placed in a folder, e.g. with the name 4 ________ .", "blank": True}, "correctAnswer": "Grandparents", "acceptableAnswers": ["Grandparents", "grandparents"]},
        {"number": 5, "order": 4, "type": "GAP_FILL", "content": {"stem": "The 5 ________ and contrast can be improved if necessary.", "blank": True}, "correctAnswer": "colour", "acceptableAnswers": ["colour", "color"]},
        {"number": 6, "order": 5, "type": "GAP_FILL", "content": {"stem": "Photos which are very fragile will be scanned by 6 ________ .", "blank": True}, "correctAnswer": "hand"},
        {"number": 7, "order": 6, "type": "GAP_FILL", "content": {"stem": "remove an object from a photo, or change the 7 ________ .", "blank": True}, "correctAnswer": "background"},
        {"number": 8, "order": 7, "type": "GAP_FILL", "content": {"stem": "A photo which is not correctly in 8 ________ cannot be fixed.", "blank": True}, "correctAnswer": "focus"},
        {"number": 9, "order": 8, "type": "GAP_FILL", "content": {"stem": "Orders are completed within 9 ________ .", "blank": True}, "correctAnswer": "10 days", "acceptableAnswers": ["10 days", "ten days"]},
        {"number": 10, "order": 9, "type": "GAP_FILL", "content": {"stem": "Send the photos in a box (not 10 ________ ).", "blank": True}, "correctAnswer": "plastic"},
    ]

    s2_content = """Questions 11–15
Choose the correct letter, A, B or C.

11 Dartfield House school used to be
A a tourist information centre.
B a private home.
C a local council building.

12 What is planned with regard to the lower school?
A All buildings on the main site will be improved.
B The lower school site will be used for new homes.
C Additional school buildings will be constructed on the lower school site.

13 The catering has been changed because of
A long queuing times.
B changes to the school timetable.
C dissatisfaction with the menus.

14 Parents are asked to
A help their children to decide in advance which serving point to use.
B make sure their children have enough money for food.
C advise their children on healthy food to eat.

15 What does the speaker say about the existing canteen?
A Food will still be served there.
B Only staff will have access to it.
C Pupils can take their food into it.

Questions 16–18
What comment does the speaker make about each of the following serving points in the Food Hall?
Choose THREE answers from the box and write the correct letter, A–D, next to Questions 16–18.

Comments
A pupils help to plan menus
B only vegetarian food
C different food every week
D daily change in menu

Food available at serving points in Food Hall
16 World Adventures
17 Street Life
18 Speedy Italian

Questions 19 and 20
Choose TWO letters, A–E.
Which TWO optional after-school lessons are new?
A swimming
B piano
C acting
D cycling
E theatre sound and lighting"""

    serving_point_comments_opts = [
        {"label": "A", "text": "pupils help to plan menus"},
        {"label": "B", "text": "only vegetarian food"},
        {"label": "C", "text": "different food every week"},
        {"label": "D", "text": "daily change in menu"},
    ]

    lessons_opts = [
        {"label": "A", "text": "swimming"},
        {"label": "B", "text": "piano"},
        {"label": "C", "text": "acting"},
        {"label": "D", "text": "cycling"},
        {"label": "E", "text": "theatre sound and lighting"},
    ]

    s2_questions = [
        {"number": 11, "order": 10, "type": "MULTIPLE_CHOICE", "content": {"stem": "Dartfield House school used to be", "options": [{"label": "A", "text": "a tourist information centre."}, {"label": "B", "text": "a private home."}, {"label": "C", "text": "a local council building."}]}, "correctAnswer": "C"},
        {"number": 12, "order": 11, "type": "MULTIPLE_CHOICE", "content": {"stem": "What is planned with regard to the lower school?", "options": [{"label": "A", "text": "All buildings on the main site will be improved."}, {"label": "B", "text": "The lower school site will be used for new homes."}, {"label": "C", "text": "Additional school buildings will be constructed on the lower school site."}]}, "correctAnswer": "B"},
        {"number": 13, "order": 12, "type": "MULTIPLE_CHOICE", "content": {"stem": "The catering has been changed because of", "options": [{"label": "A", "text": "long queuing times."}, {"label": "B", "text": "changes to the school timetable."}, {"label": "C", "text": "dissatisfaction with the menus."}]}, "correctAnswer": "A"},
        {"number": 14, "order": 13, "type": "MULTIPLE_CHOICE", "content": {"stem": "Parents are asked to", "options": [{"label": "A", "text": "help their children to decide in advance which serving point to use."}, {"label": "B", "text": "make sure their children have enough money for food."}, {"label": "C", "text": "advise their children on healthy food to eat."}]}, "correctAnswer": "A"},
        {"number": 15, "order": 14, "type": "MULTIPLE_CHOICE", "content": {"stem": "What does the speaker say about the existing canteen?", "options": [{"label": "A", "text": "Food will still be served there."}, {"label": "B", "text": "Only staff will have access to it."}, {"label": "C", "text": "Pupils can take their food into it."}]}, "correctAnswer": "C"},
        {"number": 16, "order": 15, "type": "MATCHING", "content": {"stem": "World Adventures", "options": serving_point_comments_opts}, "correctAnswer": "D"},
        {"number": 17, "order": 16, "type": "MATCHING", "content": {"stem": "Street Life", "options": serving_point_comments_opts}, "correctAnswer": "A"},
        {"number": 18, "order": 17, "type": "MATCHING", "content": {"stem": "Speedy Italian", "options": serving_point_comments_opts}, "correctAnswer": "B"},
        {"number": 19, "order": 18, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO optional after-school lessons are new? (Option 1)", "options": lessons_opts}, "correctAnswer": "B", "acceptableAnswers": ["B", "C"]},
        {"number": 20, "order": 19, "type": "MULTIPLE_CHOICE", "content": {"stem": "Which TWO optional after-school lessons are new? (Option 2)", "options": lessons_opts}, "correctAnswer": "C", "acceptableAnswers": ["B", "C"]},
    ]

    s3_content = """Questions 21–24
Choose the correct letter, A, B or C.

Assignment on sleep and dreams
21 Luke read that one reason why we often forget dreams is that
A our memories cannot cope with too much information.
B we might otherwise be confused about what is real.
C we do not think they are important.

22 What do Luke and Susie agree about dreams predicting the future?
A It may just be due to chance.
B It only happens with certain types of event.
C It happens more often than some people think.

23 Susie says that a study on pre-school children having a short nap in the day
A had controversial results.
B used faulty research methodology.
C failed to reach any clear conclusions.

24 In their last assignment, both students had problems with
A statistical analysis.
B making an action plan.
C self-assessment.

Questions 25–30
Complete the flow chart below.
Write ONE WORD ONLY for each answer.

Assignment plan
Decide on research question:
Is there a relationship between hours of sleep and number of dreams?
↓
Decide on sample:
Twelve students from the 25 ............... department
↓
Decide on methodology:
Self-reporting
↓
Decide on procedure:
Answers on 26 ...............
↓
Check ethical guidelines for working with 27 ...............
Ensure that risk is assessed and 28 ............... is kept to a minimum
↓
Analyse the results
Calculate the correlation and make a 29 ...............
↓
30 ............... the research"""

    s3_questions = [
        {"number": 21, "order": 20, "type": "MULTIPLE_CHOICE", "content": {"stem": "Luke read that one reason why we often forget dreams is that", "options": [{"label": "A", "text": "our memories cannot cope with too much information."}, {"label": "B", "text": "we might otherwise be confused about what is real."}, {"label": "C", "text": "we do not think they are important."}]}, "correctAnswer": "B"},
        {"number": 22, "order": 21, "type": "MULTIPLE_CHOICE", "content": {"stem": "What do Luke and Susie agree about dreams predicting the future?", "options": [{"label": "A", "text": "It may just be due to chance."}, {"label": "B", "text": "It only happens with certain types of event."}, {"label": "C", "text": "It happens more often than some people think."}]}, "correctAnswer": "A"},
        {"number": 23, "order": 22, "type": "MULTIPLE_CHOICE", "content": {"stem": "Susie says that a study on pre-school children having a short nap in the day", "options": [{"label": "A", "text": "had controversial results."}, {"label": "B", "text": "used faulty research methodology."}, {"label": "C", "text": "failed to reach any clear conclusions."}]}, "correctAnswer": "C"},
        {"number": 24, "order": 23, "type": "MULTIPLE_CHOICE", "content": {"stem": "In their last assignment, both students had problems with", "options": [{"label": "A", "text": "statistical analysis."}, {"label": "B", "text": "making an action plan."}, {"label": "C", "text": "self-assessment."}]}, "correctAnswer": "C"},
        {"number": 25, "order": 24, "type": "GAP_FILL", "content": {"stem": "Twelve students from the 25 ________ department", "blank": True}, "correctAnswer": "history"},
        {"number": 26, "order": 25, "type": "GAP_FILL", "content": {"stem": "Answers on 26 ________", "blank": True}, "correctAnswer": "paper"},
        {"number": 27, "order": 26, "type": "GAP_FILL", "content": {"stem": "Check ethical guidelines for working with 27 ________", "blank": True}, "correctAnswer": "humans", "acceptableAnswers": ["humans", "people"]},
        {"number": 28, "order": 27, "type": "GAP_FILL", "content": {"stem": "Ensure that risk is assessed and 28 ________ is kept to a minimum", "blank": True}, "correctAnswer": "stress"},
        {"number": 29, "order": 28, "type": "GAP_FILL", "content": {"stem": "Calculate the correlation and make a 29 ________", "blank": True}, "correctAnswer": "graph"},
        {"number": 30, "order": 29, "type": "GAP_FILL", "content": {"stem": "30 ________ the research", "blank": True}, "correctAnswer": "evaluate"},
    ]

    s4_content = """Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Health benefits of dance
Recent findings:
• All forms of dance produce various hormones associated with feelings of happiness.
• Dancing with others has a more positive impact than dancing alone.
• An experiment on university students suggested that dance increases 31 ............... .
• For those with mental illness, dance could be used as a form of 32 ............... .

Benefits of dance for older people:
• accessible for people with low levels of 33 ...............
• reduces the risk of heart disease
• better 34 ............... reduces the risk of accidents
• improves 35 ............... function by making it work faster
• improves participants' general well-being
• gives people more 36 ............... to take exercise
• can lessen the feeling of 37 ............... , very common in older people

Benefits of Zumba:
• A study at The University of Wisconsin showed that doing Zumba for 40 minutes uses up as many 38 ............... as other quite intense forms of exercise.
• The American Journal of Health Behavior study showed that:
  - women suffering from 39 ............... benefited from doing Zumba.
  - Zumba became a 40 ............... for the participants."""

    s4_questions = [
        {"number": 31, "order": 30, "type": "GAP_FILL", "content": {"stem": "suggested that dance increases 31 ________ .", "blank": True}, "correctAnswer": "creativity"},
        {"number": 32, "order": 31, "type": "GAP_FILL", "content": {"stem": "dance could be used as a form of 32 ________ .", "blank": True}, "correctAnswer": "therapy"},
        {"number": 33, "order": 32, "type": "GAP_FILL", "content": {"stem": "accessible for people with low levels of 33 ________", "blank": True}, "correctAnswer": "fitness"},
        {"number": 34, "order": 33, "type": "GAP_FILL", "content": {"stem": "better 34 ________ reduces the risk of accidents", "blank": True}, "correctAnswer": "balance"},
        {"number": 35, "order": 34, "type": "GAP_FILL", "content": {"stem": "improves 35 ________ function by making it work faster", "blank": True}, "correctAnswer": "brain"},
        {"number": 36, "order": 35, "type": "GAP_FILL", "content": {"stem": "gives people more 36 ________ to take exercise", "blank": True}, "correctAnswer": "motivation"},
        {"number": 37, "order": 36, "type": "GAP_FILL", "content": {"stem": "can lessen the feeling of 37 ________ , very common in older people", "blank": True}, "correctAnswer": "isolation"},
        {"number": 38, "order": 37, "type": "GAP_FILL", "content": {"stem": "doing Zumba for 40 minutes uses up as many 38 ________", "blank": True}, "correctAnswer": "calories"},
        {"number": 39, "order": 38, "type": "GAP_FILL", "content": {"stem": "women suffering from 39 ________ benefited from doing Zumba.", "blank": True}, "correctAnswer": "obesity"},
        {"number": 40, "order": 39, "type": "GAP_FILL", "content": {"stem": "Zumba became a 40 ________ for the participants.", "blank": True}, "correctAnswer": "habit"},
    ]

    t36_listening = {
        "title": "Test 36.C16.02 - Listening",
        "slug": "test-36-listening",
        "skill": "LISTENING",
        "status": "DRAFT",
        "parts": [
            {"title": "Section 1", "content": s1_content, "audioUrl": "/uploads/audio/test-36-section-1.mp3", "questions": s1_questions},
            {"title": "Section 2", "content": s2_content, "audioUrl": "/uploads/audio/test-36-section-2.mp3", "questions": s2_questions},
            {"title": "Section 3", "content": s3_content, "audioUrl": "/uploads/audio/test-36-section-3.mp3", "questions": s3_questions},
            {"title": "Section 4", "content": s4_content, "audioUrl": "/uploads/audio/test-36-section-4.mp3", "questions": s4_questions},
        ]
    }

    return [t36_listening]

