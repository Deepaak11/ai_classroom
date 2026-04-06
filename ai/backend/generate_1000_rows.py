import csv
import random
from datetime import datetime, timedelta

SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Computer Science", "DBMS", "Networks", "English", "History", "Biology"]
TASK_TYPES = [
    ("Assignment", ["assignment", "homework", "coursework", "project", "essay", "paper"]),
    ("Test", ["test", "unit test", "class test", "written test", "mock test"]),
    ("Exam", ["exam", "examination", "final exam", "midterm", "oral exam"]),
    ("Quiz", ["quiz", "pop quiz", "short quiz"]),
    ("Reminder", ["reminder", "announcement", "important note"])
]

DEADLINES = [
    ("tomorrow", "tomorrow"),
    ("next thursday", "next_thursday"),
    ("by the end of the week", "end_of_week"),
    ("next monday", "next_monday"),
    ("today", "today"),
    ("in two weeks", "in_two_weeks"),
    ("on April 15", "2026-04-15"),
    ("on May 3", "2026-05-03"),
    ("by the end of the month", "end_of_month")
]

TEMPLATES = [
    "Please make sure to complete the {subject} {task_name} {deadline}.",
    "We will have a {task_name} on {subject} {deadline}.",
    "Your {subject} {task_name} is due {deadline}.",
    "Don't forget about the {subject} {task_name} happening {deadline}.",
    "The {task_name} for {subject} must be submitted {deadline}.",
    "Prepare for the {subject} {task_name} scheduled for {deadline}.",
    "Just a quick {task_name} regarding your {subject} class {deadline}.",
    "I want to announce a {task_name} for {subject} {deadline}.",
    "The upcoming {subject} {task_name} is extremely important. It is due {deadline}."
]

def generate_row(row_id):
    subject = random.choice(SUBJECTS)
    task_category, task_names = random.choice(TASK_TYPES)
    task_name = random.choice(task_names)
    deadline_phrase, expected_deadline = random.choice(DEADLINES)
    template = random.choice(TEMPLATES)
    
    raw_transcript = template.format(
        subject=subject, 
        task_name=task_name, 
        deadline=deadline_phrase
    )
    
    expected_title = f"{subject} {task_name}".capitalize()
    
    return [
        row_id,
        raw_transcript,
        task_category,
        subject,
        expected_deadline,
        expected_title,
        "Auto-generated synthetic data"
    ]

# The file already has 60 rows
START_ID = 61
TOTAL_NEW_ROWS = 1000

new_rows = [generate_row(i) for i in range(START_ID, START_ID + TOTAL_NEW_ROWS)]

file_path = "c:/Users/kgmr1/Downloads/classroom-assistant/sample_dataset.csv"

# Append the rows
with open(file_path, "a", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    for row in new_rows:
        writer.writerow(row)

print(f"Successfully appended {TOTAL_NEW_ROWS} new synthetic test cases to sample_dataset.csv!")
