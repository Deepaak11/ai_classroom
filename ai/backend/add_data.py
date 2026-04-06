import csv
import random

new_rows = [
    # Assigments
    [31, "The programming assignment on REST APIs is due next Friday.", "Assignment", "Computer Science", "next_friday", "Programming assignment on REST APIs", "REST APIs"],
    [32, "Submit your essay on the Industrial Revolution by tomorrow.", "Assignment", "History", "tomorrow", "Essay on Industrial Revolution", "History essay"],
    [33, "Work on the calculus limits worksheet and have it done by Wednesday.", "Assignment", "Mathematics", "wednesday", "Calculus limits worksheet", "Math worksheet"],
    [34, "Your term paper for English literature must be submitted by the end of the month.", "Assignment", "English", "end_of_month", "Term paper for English literature", "Term paper"],
    [35, "Remember to finish the database normalization coursework by April 22.", "Assignment", "DBMS", "2026-04-22", "Database normalization coursework", "DBMS coursework"],
    [36, "The group project on quantum mechanics is due in two weeks.", "Assignment", "Physics", "in_two_weeks", "Group project on quantum mechanics", "Group project"],
    [37, "Your organic chemistry lab report needs to be submitted today.", "Assignment", "Chemistry", "today", "Organic chemistry lab report", "Lab report"],
    [38, "Please complete the networking topology assignment by next Monday.", "Assignment", "Networks", "next_monday", "Networking topology assignment", "Networking"],
    [39, "The homework on cellular respiration is due tomorrow morning.", "Assignment", "Biology", "tomorrow", "Homework on cellular respiration", "Homework"],
    [40, "Make sure your submission for the data structures project is in by Friday.", "Assignment", "Computer Science", "friday", "Data structures project submission", "Project"],

    # Quizzes
    [41, "We are having a pop quiz on SQL subqueries this Thursday.", "Quiz", "DBMS", "thursday", "Pop quiz on SQL subqueries", "Pop quiz keyword"],
    [42, "There will be a short quiz on Shakespearean sonnets next week.", "Quiz", "English", "next_week", "Short quiz on Shakespearean sonnets", "Short quiz"],
    [43, "Get ready for a quiz on Newtonian mechanics tomorrow.", "Quiz", "Physics", "tomorrow", "Quiz on Newtonian mechanics", "Physics quiz"],
    [44, "We have a quiz covering World War II history on April 15.", "Quiz", "History", "2026-04-15", "Quiz covering World War II", "History quiz"],
    [45, "A quick quiz on genetic inheritance will happen in three days.", "Quiz", "Biology", "in_three_days", "Quick quiz on genetic inheritance", "Biology"],

    # Tests
    [46, "The unit test for algebraic equations is scheduled for next Tuesday.", "Test", "Mathematics", "next_tuesday", "Unit test for algebraic equations", "Unit test"],
    [47, "We will have a class test on organic compounds on May 3.", "Test", "Chemistry", "2026-05-03", "Class test on organic compounds", "Class test"],
    [48, "The written test for operating systems algorithms is this Friday.", "Test", "Computer Science", "friday", "Written test for OS algorithms", "Written test"],
    [49, "Prepare for the mock test on network security next month.", "Test", "Networks", "next_month", "Mock test on network security", "Mock test"],
    [50, "You have a test on ecosystem dynamics tomorrow.", "Test", "Biology", "tomorrow", "Test on ecosystem dynamics", "Test"],

    # Exams
    [51, "The final exam for Calculus II is on May 20.", "Exam", "Mathematics", "2026-05-20", "Final exam for Calculus II", "Final exam"],
    [52, "Your midterm examination for DBMS architecture will be on April 12.", "Exam", "DBMS", "2026-04-12", "Midterm examination for DBMS architecture", "Midterm"],
    [53, "We are holding the historical civilization midterm next Monday.", "Exam", "History", "next_monday", "Historical civilization midterm", "Midterm variant"],
    [54, "The comprehensive exam on English grammar starts May 5.", "Exam", "English", "2026-05-05", "Comprehensive exam on English grammar", "Comprehensive exam"],
    [55, "The final examination covering thermodynamics is scheduled for end of next week.", "Exam", "Physics", "end_of_next_week", "Final exam covering thermodynamics", "Physics exam"],

    # Reminders
    [56, "Important note: the chemistry lab coat is required for tomorrow.", "Reminder", "Chemistry", "tomorrow", "Chemistry lab coat required", "Important note keyword"],
    [57, "Just a reminder that the biology field trip happens next Friday.", "Reminder", "Biology", "next_friday", "Biology field trip", "Reminder keyword"],
    [58, "An announcement: there are no computer science classes next week.", "Reminder", "Computer Science", "next_week", "No computer science classes", "Announcement keyword"],
    [59, "Please reminder to bring your historical maps to class on Wednesday.", "Reminder", "History", "wednesday", "Bring historical maps", "Reminder variation"],
    [60, "Important reminder: course registrations for mathematics end today.", "Reminder", "Mathematics", "today", "Course registrations for mathematics", "Reminder"]
]

with open("c:/Users/kgmr1/Downloads/classroom-assistant/sample_dataset.csv", "a", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print("Added 30 new transcript test cases to sample_dataset.csv!")
