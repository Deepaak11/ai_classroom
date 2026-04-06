"""
nlp/test_nlp.py
Standalone test script for the NLP processor.
Run: python nlp/test_nlp.py

Tests the pipeline without needing the full FastAPI server or MongoDB.
Prints extracted tasks in a human-readable table.
"""

import sys
import os
import json

# Add parent directory to path so we can import processor
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from nlp.processor import process_transcript

# ─── Test Sentences ────────────────────────────────────────────────────────────
TEST_INPUTS = [
    # ── Single sentence tests ──────────────────────────────────────────────
    "Complete the DBMS assignment on SQL joins by next Friday.",
    "We will have a quiz on normalization forms tomorrow.",
    "The final exam for Computer Networks is on April 15.",
    "Submit your data structures homework by end of this week.",

    # ── Multi-sentence paragraph (realistic lecture speech) ────────────────
    """
    Good morning class. Today we are going to cover chapter 7 of the textbook.
    Please remember to complete the assignment on binary trees by Thursday.
    We will also have a surprise quiz on recursion next Monday morning.
    The mid-semester examination is scheduled for April 20th at 9 AM.
    Don't forget to submit your lab reports on operating system scheduling by this Friday.
    For the rest of today's lecture, we will focus on heap data structures.
    """,

    # ── Edge cases ─────────────────────────────────────────────────────────
    "This is just a general statement with no task.",
    "The quiz on Python will happen in two days.",
    "Study hard for your exams.",
]

# ─── ANSI Colors ──────────────────────────────────────────────────────────────
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

TYPE_COLORS = {
    "Assignment": GREEN,
    "Test":       YELLOW,
    "Quiz":       CYAN,
    "Exam":       RED,
    "Reminder":   "\033[95m",
    "General":    "\033[90m",
}

def print_separator(char="─", width=70):
    print(char * width)

def print_task(task: dict, index: int):
    tc = TYPE_COLORS.get(task.get("type", "General"), RESET)
    print(f"  Task #{index + 1}:")
    print(f"    {BOLD}Type:     {tc}{task.get('type', 'Unknown')}{RESET}")
    print(f"    Title:    {task.get('title', 'N/A')}")
    print(f"    Subject:  {task.get('subject') or 'Not detected'}")
    print(f"    Deadline: {task.get('deadline') or 'Not specified'}")
    print(f"    Priority: {task.get('priority', 'medium')}")
    print()

def run_tests():
    print(f"\n{BOLD}{'='*70}")
    print(" AI CLASSROOM ASSISTANT — NLP PROCESSOR TEST")
    print(f"{'='*70}{RESET}\n")

    total_tasks = 0

    for i, input_text in enumerate(TEST_INPUTS, 1):
        clean = input_text.strip()
        preview = clean[:80].replace("\n", " ") + ("..." if len(clean) > 80 else "")

        print(f"{BOLD}Test {i}/{len(TEST_INPUTS)}{RESET}")
        print(f"Input: {YELLOW}\"{preview}\"{RESET}")
        print_separator()

        tasks = process_transcript(clean)

        if not tasks:
            print(f"  {RED}→ No tasks detected{RESET}")
        else:
            print(f"  {GREEN}→ {len(tasks)} task(s) extracted:{RESET}\n")
            for j, task in enumerate(tasks):
                print_task(task, j)
            total_tasks += len(tasks)

        print()

    print_separator("═")
    print(f"{BOLD}SUMMARY:{RESET}")
    print(f"  Tests run:      {len(TEST_INPUTS)}")
    print(f"  Tasks found:    {GREEN}{total_tasks}{RESET}")
    print(f"  Avg per input:  {total_tasks / len(TEST_INPUTS):.1f}")
    print_separator("═")
    print()

if __name__ == "__main__":
    run_tests()
