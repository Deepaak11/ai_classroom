"""
nlp/processor.py

NLP Processing Module:
  - spaCy: Named Entity Recognition (dates, orgs, subjects)
  - Keyword matching: detect assignment/test/exam/quiz
  - BERT-based intent classification (via Hugging Face pipeline)
  - Returns structured JSON task object
"""

import re
import spacy
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ─── Load spaCy Model ─────────────────────────────────────────────────────────
# Run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model loaded: en_core_web_sm")
except OSError:
    print("⚠️  spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None

# ─── BERT Classifier (Hugging Face) ───────────────────────────────────────────
# Uses zero-shot-classification to classify sentences
# Loads on first use to avoid slowing startup
_classifier = None

def get_classifier():
    """Lazy-load the BERT zero-shot classifier."""
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            _classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",   # Lightweight zero-shot model
                device=-1                            # Use CPU (-1); set 0 for GPU
            )
            print("✅ BERT zero-shot classifier loaded")
        except Exception as e:
            logger.warning(f"BERT classifier not available: {e}. Using keyword fallback.")
            _classifier = "fallback"
    return _classifier

# ─── Subject Keywords ─────────────────────────────────────────────────────────
SUBJECT_KEYWORDS = {
    "Mathematics": ["math", "mathematics", "algebra", "calculus", "geometry", "statistics"],
    "Physics": ["physics", "mechanics", "thermodynamics", "optics", "quantum"],
    "Chemistry": ["chemistry", "organic", "inorganic", "chemical", "molecules"],
    "Computer Science": ["cs", "computer science", "programming", "coding", "algorithm", "data structure"],
    "DBMS": ["dbms", "database", "sql", "nosql", "mongodb", "mysql", "queries"],
    "Networks": ["networks", "networking", "tcp", "ip", "protocol", "router", "socket"],
    "English": ["english", "grammar", "essay", "literature", "writing", "reading"],
    "History": ["history", "historical", "civilization", "empire", "war", "revolution"],
    "Biology": ["biology", "cell", "genetics", "ecosystem", "anatomy", "organism"],
}

# ─── Task Type Keywords ────────────────────────────────────────────────────────
TASK_KEYWORDS = {
    "Assignment": ["assignment", "homework", "coursework", "project due"],
    "Test": ["test", "unit test", "class test", "written test"],
    "Exam": ["exam", "examination", "final exam", "midterm"],
    "Quiz": ["quiz", "quizzes", "short quiz", "pop quiz"],
    "Reminder": ["reminder", "important note", "announcement"],
}

# ─── Relative Date Resolution ─────────────────────────────────────────────────
RELATIVE_DATES = {
    "today": 0, "tonight": 0,
    "tomorrow": 1, "next day": 1,
    "day after tomorrow": 2,
    "next week": 7, "next monday": 7,
    "in two days": 2, "in 2 days": 2,
    "in three days": 3, "in 3 days": 3,
    "in a week": 7, "within a week": 7,
    "end of week": 5, "this friday": 4,
    "next month": 30,
}

def resolve_relative_date(text: str) -> Optional[str]:
    """Convert relative date phrases and exact weekdays to YYYY-MM-DD format."""
    text_lower = text.lower()
    
    # 1. Check strict relative phrases (e.g., 'tomorrow')
    for phrase, days_ahead in RELATIVE_DATES.items():
        if phrase in text_lower:
            target = datetime.now() + timedelta(days=days_ahead)
            return target.strftime("%Y-%m-%d")
            
    # 2. Dynamically calculate days of the week (e.g., 'friday', 'monday')
    days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(days_of_week):
        if day in text_lower:
            current_day_idx = datetime.now().weekday()
            days_ahead = (i - current_day_idx) % 7
            if days_ahead == 0:
                days_ahead = 7  # If it's Monday and they say 'Monday', they mean next week
            target = datetime.now() + timedelta(days=days_ahead)
            return target.strftime("%Y-%m-%d")
            
    return None

def extract_date(doc, raw_text: str) -> Optional[str]:
    """Extract dates from spaCy entities or resolve relative references."""
    # 1. Check spaCy DATE entities
    for ent in doc.ents:
        if ent.label_ == "DATE":
            entity_text = ent.text.lower()
            # Try relative resolution first
            resolved = resolve_relative_date(entity_text)
            if resolved:
                return resolved
            # Strip "th", "nd", "rd", "st" to prevent strptime errors (e.g. "april 15th" -> "april 15")
            clean_entity_text = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', entity_text)
            
            # Try to parse explicit date formats
            for fmt in ["%B %d", "%B %d, %Y", "%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d"]:
                try:
                    parsed = datetime.strptime(clean_entity_text, fmt)
                    if parsed.year == 1900:
                        parsed = parsed.replace(year=datetime.now().year)
                    return parsed.strftime("%Y-%m-%d")
                except ValueError:
                    continue

    # 2. Fallback: regex date patterns
    patterns = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',          # 04/02/2026
        r'\b(\d{4}-\d{2}-\d{2})\b',                        # 2026-04-02
        r'\b(january|february|march|april|may|june|july|august|'
        r'september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\b', # April 2 or April 2nd
    ]
    for pattern in patterns:
        match = re.search(pattern, raw_text.lower())
        if match:
            return match.group(0)

    # 3. Try relative date on full text
    return resolve_relative_date(raw_text)

def detect_subject(text: str) -> Optional[str]:
    """Detect the academic subject mentioned in the text."""
    text_lower = text.lower()
    for subject, keywords in SUBJECT_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return subject
    return None

def detect_task_type_keywords(text: str) -> str:
    """Keyword-based task type detection as fallback."""
    text_lower = text.lower()
    for task_type, keywords in TASK_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return task_type
    return "General"

def classify_with_bert(text: str) -> str:
    """
    Classify task type using BERT zero-shot classification.
    Falls back to keyword matching if model unavailable.
    """
    classifier = get_classifier()

    if classifier == "fallback" or classifier is None:
        return detect_task_type_keywords(text)

    try:
        candidate_labels = ["Assignment", "Test", "Quiz", "Exam", "Reminder", "General"]
        result = classifier(text, candidate_labels)
        # result['labels'][0] is the highest scoring label
        top_label = result["labels"][0]
        top_score = result["scores"][0]
        # Only use BERT result if confidence > 40%
        if top_score > 0.40:
            return top_label
        else:
            return detect_task_type_keywords(text)
    except Exception as e:
        logger.warning(f"BERT classification failed: {e}. Using keyword fallback.")
        return detect_task_type_keywords(text)

def extract_title(doc, task_type: str, subject: Optional[str]) -> str:
    """
    Generate a meaningful title from the sentence.
    Strips common stopwords and builds a clean title.
    """
    # Remove time expressions and very short tokens
    skip_labels = {"DATE", "TIME", "CARDINAL", "ORDINAL"}
    tokens = [
        token.text for token in doc
        if not token.is_stop
        and not token.is_punct
        and token.ent_type_ not in skip_labels
        and len(token.text) > 2
    ]
    if tokens:
        title = " ".join(tokens[:8]).strip()   # Max 8 meaningful words
        return title.capitalize()

    # Fallback: use task type + subject
    if subject:
        return f"{task_type} - {subject}"
    return f"{task_type} Task"

def estimate_priority(task_type: str, deadline_str: Optional[str]) -> str:
    """Estimate priority based on task type and deadline proximity."""
    if not deadline_str:
        return "medium"
    try:
        deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
        days_left = (deadline - datetime.now()).days
        if task_type in ["Exam", "Test"] or days_left <= 2:
            return "high"
        elif days_left <= 5:
            return "medium"
        else:
            return "low"
    except Exception:
        return "medium"

# ─── Main Processing Function ─────────────────────────────────────────────────
def process_transcript(text: str) -> list[dict]:
    """
    Main entry point. Processes raw transcript text.

    Steps:
    1. Split into sentences
    2. For each sentence: detect task type, extract entities
    3. Return list of structured task dicts

    Args:
        text: Raw speech transcript

    Returns:
        List of task dicts (may be empty if no tasks detected)
    """
    if not text or len(text.strip()) < 5:
        return []

    tasks = []

    # ── Use spaCy if available, else basic sentence splitting ─────────────────
    if nlp:
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
    else:
        # Basic sentence splitting fallback
        sentences = [s.strip() for s in re.split(r'[.!?]', text) if len(s.strip()) > 10]

    for sentence in sentences:
        # ── Step 1: Detect if sentence contains a task ────────────────────────
        # Require STRICT keyword matching to prevent random conversational text from becoming tasks
        keyword_task_type = detect_task_type_keywords(sentence)
        if keyword_task_type == "General":
            continue   # Skip - no valid task keyword found
        
        # Use BERT for better classification, but ONLY if we already know a valid keyword exists
        task_type = classify_with_bert(sentence) if classify_with_bert.__code__ else keyword_task_type
        if task_type == "General":
            task_type = keyword_task_type

        # ── Step 2: Parse sentence with spaCy ────────────────────────────────
        sent_doc = nlp(sentence) if nlp else None

        # ── Step 3: Extract entities ──────────────────────────────────────────
        deadline = extract_date(sent_doc, sentence) if sent_doc else resolve_relative_date(sentence)
        subject  = detect_subject(sentence)
        title    = extract_title(sent_doc, task_type, subject) if sent_doc else f"{task_type} - {subject or 'General'}"
        priority = estimate_priority(task_type, deadline)

        # ── Step 4: Build structured task ────────────────────────────────────
        task = {
            "type":        task_type,
            "title":       title,
            "deadline":    deadline,
            "subject":     subject,
            "description": sentence,           # Full original sentence
            "priority":    priority,
        }
        tasks.append(task)

    return tasks


# ─── Quick Test (run: python nlp/processor.py) ────────────────────────────────
if __name__ == "__main__":
    sample = (
        "Students, please complete the DBMS assignment on SQL joins by next Friday. "
        "We will also have a quiz on normalization forms tomorrow. "
        "The final exam for Computer Networks is scheduled on April 15. "
        "Remember to read chapters 5 through 8 before the next class."
    )
    results = process_transcript(sample)
    import json
    print(json.dumps(results, indent=2))
