from processor import extract_date
import spacy

nlp = spacy.load("en_core_web_sm")

def test_date(text):
    doc = nlp(text)
    print(f"Testing: '{text}'")
    
    print("Entities found by spaCy:")
    for ent in doc.ents:
        print(f" - {ent.text} ({ent.label_})")
        
    date = extract_date(doc, text)
    print(f"Resulting Date: {date}\n")

print("--- Testing Dates ---")
test_date("Final exam for networks is on April 15th.")
test_date("Complete the DBMS assignment on Sequel joins by Friday.")
test_date("We have a quiz on normalization tomorrow.")
