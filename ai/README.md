# 🎙️ AI Classroom Assistant
### Real-Time Speech-to-Task Intelligence System

A full-stack academic tool that listens to teacher lectures in real-time, extracts academic tasks (assignments, tests, exams, quizzes) using AI/NLP, and displays them automatically on a student dashboard.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                      │
│                                                                   │
│  ┌──────────────────────┐      ┌──────────────────────────────┐  │
│  │   Teacher Interface  │      │     Student Dashboard         │  │
│  │  ┌────────────────┐  │      │  ┌────────────────────────┐  │  │
│  │  │ Web Speech API │  │      │  │  Task Cards (live feed) │  │  │
│  │  │ (microphone)   │  │      │  │  Filters: Pending/Done  │  │  │
│  │  └───────┬────────┘  │      │  │  Deadline countdown     │  │  │
│  │          │ transcript│      │  │  Mark complete toggle   │  │  │
│  └──────────┼───────────┘      └──────────────────────────────┘  │
└─────────────┼─────────────────────────────────────────────────────┘
              │ POST /tasks/process-text          ↑ GET /tasks/
              ▼                                  │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                   │
│                                                                   │
│  ┌──────────────┐   ┌────────────────────┐   ┌───────────────┐  │
│  │  /auth/*     │   │ /tasks/process-text│   │ /tasks/       │  │
│  │  JWT Login   │   │                    │   │ GET/POST/PATCH│  │
│  │  Register    │   │  NLP Pipeline:     │   │ DELETE        │  │
│  └──────────────┘   │  1. spaCy NER      │   └───────┬───────┘  │
│                      │  2. BERT classify  │           │          │
│                      │  3. Date resolve   │           │          │
│                      └────────┬───────────┘           │          │
└───────────────────────────────┼───────────────────────┼──────────┘
                                │ insert                 │ find
                                ▼                        ▼
                    ┌───────────────────────────────────────┐
                    │         MongoDB (ai_classroom)         │
                    │   Collection: tasks                    │
                    │   Collection: users                    │
                    └───────────────────────────────────────┘
```

---

## 📁 Project Structure

```
classroom-assistant/
│
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt         ← Python dependencies
│   ├── .env                     ← Environment variables
│   ├── seed_database.py         ← Seed MongoDB with sample data
│   │
│   ├── database/
│   │   └── connection.py        ← Motor (async MongoDB) connection
│   │
│   ├── models/
│   │   └── task_model.py        ← Pydantic schemas (Task, User, etc.)
│   │
│   ├── routes/
│   │   ├── tasks.py             ← Task CRUD + NLP processing endpoints
│   │   └── auth.py              ← JWT login/register endpoints
│   │
│   ├── nlp/
│   │   ├── processor.py         ← Core NLP pipeline (spaCy + BERT)
│   │   └── test_nlp.py          ← Standalone NLP tester
│   │
│   └── services/                ← (Future: Firebase, email notifications)
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js               ← Main shell, routing, layout
│       ├── index.js             ← React entry point
│       ├── contexts/
│       │   └── AuthContext.js   ← Global auth state (JWT)
│       ├── hooks/
│       │   └── useSpeechRecognition.js  ← Web Speech API hook
│       ├── services/
│       │   └── api.js           ← All backend API calls
│       └── components/
│           ├── LoginPage.js     ← Login / Register UI
│           ├── TeacherInterface.js  ← Record + live transcript
│           └── StudentDashboard.js  ← Task cards + filters
│
├── sample_dataset.csv           ← 30 sample transcripts + expected outputs
└── README.md                    ← This file
```

---

## ⚙️ Prerequisites

Make sure these are installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| MongoDB | 6+ (Community) | https://www.mongodb.com/try/download/community |
| Chrome / Edge | Latest | (for Web Speech API) |

---

## 🚀 Step-by-Step Setup

### STEP 1 — Clone / Download the Project

```bash
# If you have git:
git clone <your-repo-url>
cd classroom-assistant

# Or just unzip the folder and cd into it
```

---

### STEP 2 — Start MongoDB

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Windows:**
```bash
# Run MongoDB as a service (after installation)
net start MongoDB

# OR manually:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Linux (Ubuntu):**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod   # auto-start on boot
```

**Verify MongoDB is running:**
```bash
mongosh
# You should see a prompt. Type: show dbs
```

---

### STEP 3 — Set Up the Backend

```bash
# Navigate to backend folder
cd classroom-assistant/backend

# Create a Python virtual environment
python -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install all Python packages
pip install -r requirements.txt
```

**Install spaCy language model** (required for NER):
```bash
python -m spacy download en_core_web_sm
```

**Configure environment variables:**
```bash
# The .env file already exists. Edit it if needed:
# MONGO_URL=mongodb://localhost:27017
# JWT_SECRET=your_secret_key_here
```

**Start the FastAPI server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ Connected to MongoDB at mongodb://localhost:27017
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Interactive API docs** (Swagger UI):  
👉 Open: http://localhost:8000/docs

---

### STEP 4 — Seed the Database (Optional but Recommended)

This loads 30 sample tasks so you can see the student dashboard immediately:

```bash
# Make sure you're in the backend folder with venv activated
python seed_database.py
```

Output:
```
✅ Seeded 30 tasks into MongoDB!
   Database: ai_classroom | Collection: tasks
```

---

### STEP 5 — Set Up the Frontend

```bash
# Open a NEW terminal tab/window
cd classroom-assistant/frontend

# Install Node.js packages
npm install

# Start the React development server
npm start
```

The browser will open at: **http://localhost:3000**

---

### STEP 6 — Use the Application

1. **Open Chrome or Edge** (required for Web Speech API)
2. Go to `http://localhost:3000`
3. Click **"Demo Teacher"** or **"Demo Student"** for instant access

**As a Teacher:**
- Click **"Start Recording"**
- Allow microphone access when prompted
- Speak: *"Complete the DBMS assignment on SQL joins by Friday"*
- Watch the transcript appear live
- AI automatically extracts tasks every 8 seconds
- Click **"Send to AI"** to process immediately

**As a Student:**
- See all extracted tasks as cards
- Filter by: Pending / Completed / by Type
- Mark tasks as completed with a click
- Dashboard auto-refreshes every 15 seconds

---

## 🧪 Test the NLP Module Alone

No server or MongoDB needed:

```bash
cd backend
python nlp/test_nlp.py
```

Expected output:
```
══════════════════════════════════════════════
 AI CLASSROOM ASSISTANT — NLP PROCESSOR TEST
══════════════════════════════════════════════

Test 1/8
Input: "Complete the DBMS assignment on SQL joins by next Friday."
────────────────────────────────────────────
  → 1 task(s) extracted:

  Task #1:
    Type:     Assignment
    Title:    Complete DBMS assignment SQL joins
    Subject:  DBMS
    Deadline: 2026-04-03
    Priority: medium
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{name, email, password, role}` | Create account |
| POST | `/auth/login` | `{email, password}` | Get JWT token |
| GET | `/auth/me` | Header: `Authorization: Bearer <token>` | Current user |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/process-text` | Send transcript → NLP → save tasks |
| GET | `/tasks/` | Get all tasks (with filters) |
| POST | `/tasks/` | Create task manually |
| PATCH | `/tasks/{id}` | Update task status |
| DELETE | `/tasks/{id}` | Delete task |
| GET | `/tasks/stats/summary` | Dashboard statistics |

**Example: Process a transcript**
```bash
curl -X POST http://localhost:8000/tasks/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Complete the networking assignment by April 10. We have a quiz on TCP/IP tomorrow."}'
```

Response:
```json
{
  "message": "2 task(s) extracted and saved.",
  "tasks_saved": 2,
  "tasks": [
    {
      "type": "Assignment",
      "title": "Complete networking assignment",
      "deadline": "2026-04-10",
      "subject": "Networks",
      "priority": "medium",
      "status": "pending"
    },
    {
      "type": "Quiz",
      "title": "Quiz TCP IP",
      "deadline": "2026-03-30",
      "subject": "Networks",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

---

## 🧠 How the NLP Pipeline Works

```
Raw Speech Text
      │
      ▼
┌─────────────────────────────┐
│ 1. Sentence Splitting       │  spaCy doc.sents
│    (per sentence)           │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 2. Task Type Classification │  BERT zero-shot classifier
│    Assignment / Test / Quiz │  → fallback to keyword match
│    Exam / Reminder / General│
└─────────────┬───────────────┘
              │ (skip "General" unless keyword match)
              ▼
┌─────────────────────────────┐
│ 3. Named Entity Recognition │  spaCy NER
│    • DATE entities           │  → resolve relative dates
│    • Regex date patterns     │    (tomorrow → 2026-03-30)
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 4. Subject Detection        │  Keyword dictionary lookup
│    DBMS / Physics / CS ...  │  (30+ academic keywords)
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 5. Priority Estimation      │  Type + days-until-deadline
│    high / medium / low      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 6. Structured JSON Output   │
│  {type, title, deadline,    │
│   subject, priority}        │
└─────────────────────────────┘
```

---

## 🗄️ MongoDB Schema

**Database:** `ai_classroom`

**Collection: `tasks`**
```json
{
  "_id": "ObjectId",
  "type": "Assignment | Test | Quiz | Exam | Reminder | General",
  "title": "Complete SQL joins assignment",
  "deadline": "2026-04-03",
  "subject": "DBMS",
  "description": "Original transcript sentence",
  "priority": "high | medium | low",
  "status": "pending | completed",
  "created_at": "2026-03-29T10:30:00",
  "teacher_id": "user_id_string"
}
```

**Collection: `users`**
```json
{
  "_id": "ObjectId",
  "name": "Dr. Sarah Johnson",
  "email": "sarah@university.edu",
  "password": "sha256_hashed",
  "role": "teacher | student",
  "created_at": "2026-03-29T10:00:00"
}
```

---

## 🔧 Troubleshooting

**❌ "spaCy model not found"**
```bash
python -m spacy download en_core_web_sm
```

**❌ "BERT classifier not loading"**
```bash
# It downloads automatically on first run (~1.5GB)
# Ensure you have internet connection and 2GB+ free disk space
# The app still works without it (uses keyword fallback)
```

**❌ "MongoDB connection refused"**
```bash
# Check if MongoDB is running:
sudo systemctl status mongod     # Linux
brew services list               # macOS

# Restart it:
sudo systemctl restart mongod    # Linux
brew services restart mongodb-community  # macOS
```

**❌ "Microphone not working"**
- Must use **Chrome or Edge** (Firefox doesn't support Web Speech API)
- Click the lock icon in the address bar → Allow microphone
- Must be on `http://localhost` (not a different IP)

**❌ CORS error in browser**
```bash
# Make sure backend is running on port 8000
# Check REACT_APP_API_URL in frontend/.env if you changed ports
```

**❌ Frontend shows blank page**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 🚀 Optional Enhancements

### Add Firebase Notifications
```python
# Install: pip install firebase-admin
# Add to services/notification.py and call after task creation
```

### Use OpenAI Whisper for better speech accuracy
```bash
pip install openai-whisper
# Replace Web Speech API with audio file upload + Whisper transcription
```

### Multilingual Support (Tamil)
```python
# In nlp/processor.py, change:
recognition.lang = "ta-IN"   # Tamil
# Download Tamil spaCy model if available
```

### Deploy to Cloud
- **Backend:** Railway, Render, or AWS EC2
- **Frontend:** Vercel or Netlify
- **MongoDB:** MongoDB Atlas (free tier)
- Change `REACT_APP_API_URL` and `MONGO_URL` to production URLs

---

## 📜 Quick Reference Commands

```bash
# ─── Backend ───────────────────────────────────────────
cd backend
source venv/bin/activate               # Activate virtualenv
uvicorn main:app --reload              # Start server
python seed_database.py                # Seed with sample data
python nlp/test_nlp.py                 # Test NLP pipeline only

# ─── Frontend ──────────────────────────────────────────
cd frontend
npm start                              # Start React dev server
npm run build                          # Build for production

# ─── MongoDB ───────────────────────────────────────────
mongosh                                # Open MongoDB shell
use ai_classroom                       # Switch to database
db.tasks.find().pretty()               # View all tasks
db.tasks.countDocuments()              # Count tasks
db.tasks.drop()                        # Clear all tasks

# ─── Useful API tests (curl) ───────────────────────────
# Health check
curl http://localhost:8000/

# Process transcript
curl -X POST http://localhost:8000/tasks/process-text \
  -H "Content-Type: application/json" \
  -d '{"text":"Submit the OS assignment by Friday. Quiz on memory management tomorrow."}'

# Get all tasks
curl http://localhost:8000/tasks/

# Get only pending tasks
curl "http://localhost:8000/tasks/?status=pending"

# Get stats
curl http://localhost:8000/tasks/stats/summary
```

---

## 🎓 Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js 18 | UI components & state |
| Styling | CSS-in-JS (inline) | Custom dark theme |
| Speech | Web Speech API | Browser microphone |
| HTTP Client | Fetch API | API calls |
| Backend | FastAPI (Python) | REST API server |
| NLP | spaCy 3.x | Entity recognition |
| AI | BERT (Hugging Face) | Intent classification |
| Database | MongoDB + Motor | Async data storage |
| Auth | JWT (PyJWT) | Token-based auth |
| Runtime | Uvicorn (ASGI) | Async server |

---

*Built with ❤️ for educators and students. Contributions welcome!*
