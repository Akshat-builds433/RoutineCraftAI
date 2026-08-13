# RoutineWise AI

Build a production-grade, full-stack Voice & Text Student Routine Assistant named "RoutineCraft AI" for the VoxForge hackathon track. The app allows students to enter their daily routine via voice or typing, generates a color-coded interactive timetable, and provides actionable recommendations to optimize study time, sleep, and productivity.

---

### 1. APPLICATION GOAL & DUAL-INPUT ARCHITECTURE

1. Dual Input Modality:

   - Voice Input: Real-time STT using Deepgram Nova-2 WebSockets or Web Speech API with VAD (Voice Activity Detection).

   - Text Input: A full-featured chat box and form input for typing out routines, classes, and goals manually.

2. Low-Latency Voice Engine:

   - Voice Generation (TTS): Rime API streaming for low-latency audio output (<500ms TTFA).

   - Vector Memory & Knowledge DB: Qdrant Vector DB for storing student schedule history, preferences, study goals, and academic productivity patterns.

   - LLM Orchestration: Groq API (`llama-3.1-8b-instant`) for fast response generation.

---

### 2. CORE STUDENT ROUTINE & TIMETABLE FEATURES

#### A. Data Collection Engine (Voice or Text)

The agent captures and extracts:

- Fixed Commitments: Class schedules, labs, work hours, commute times.

- Energy Levels: Peak focus hours (morning vs. night person).

- Personal Habits: Sleep hours, meal times, exercise, leisure/hobbies.

- Academic Goals: Exam prep, project deadlines, desired study hours per week.

#### B. Dynamic Timetable Generator

- Converts extracted routine data into a structured JSON array of time blocks:

  `{ time: "08:00 - 09:30", activity: "Deep Study: Physics", category: "study" | "class" | "rest" | "exercise", energyLevel: "high" }`

- Renders an interactive, color-coded Daily/Weekly Timetable Schedule Grid in the UI.

#### C. Routine Improvement & Recommendation Engine

Analyze the routine for common student productivity issues and provide targeted advice:

1. Sleep & Energy Alignment: Flag late-night cramming or inadequate sleep windows.

2. Cognitive Load Management: Identify marathon study blocks without breaks and suggest Pomodoro splits (50/10 or 25/5).

3. Spaced Repetition & Deep Work: Recommend dedicated high-energy blocks for complex subjects (e.g., coding, math, engineering drawing).

4. Balance Index: Give a visual score (1-100) on Academic Balance, Rest, and Burnout Risk.

---

### 3. TECHNICAL VOICE PIPELINE & SPEED OPTIMIZATION

#### Clause-Based Streaming (TTS Pipeline)

Do NOT wait for the full response to finish generating before playing audio. Implement a stream-buffer parser that sends text chunks to Rime TTS as soon as a complete sentence or clause (4-6 words with punctuation `,`, `.`, `?`) is generated.

#### Real-Time Interruption (Barge-in)

- Monitor continuous mic input while the agent is speaking.

- If the student speaks during playback, instantly clear the client Web Audio buffer, suspend speech playback, send a cancellation signal to the LLM/Rime backend tasks, and set state to `listening`.

#### Qdrant Async Memory Retrieval

- Store historical timetables, past student feedback, and goals in Qdrant.

- Query Qdrant asynchronously so memory context is fetched without blocking initial token generation.

---

### 4. AGENT SYSTEM PROMPT (Inject into LLM)

"You are RoutineCraft, an empathetic and highly structured AI academic coach powered by Rime and Qdrant. Speak in a concise, natural tone. When giving voice feedback, keep audio responses under 2 short sentences (under 25 words total) focusing on key timetable changes and tips. Never output raw code, markdown formatting, bullet points, or digits in speech output—spell out numbers. Concurrently, generate structured JSON for the interactive timetable UI."

---

### 5. UI / UX DESIGN REQUIREMENTS

- Theme: Clean, modern dark mode (Tailwind CSS, slate background, emerald/indigo accent colors).

- Top Bar: Model status (`Idle`, `Listening`, `Analyzing Routine`, `Speaking`, `Interrupted`) with Latency Metrics (TTFA, STT, Qdrant lookup time).

- Input Bar: Toggleable dual-input bar featuring:

  * Animated Microphone Button for continuous voice input with audio visualizer waveform.

  * Text input box with instant 'Submit' button.

- Main Dashboard Layout (Split View):

  * Left Column: Interactive Timetable Schedule Grid (filterable by day, category color-coding, editable blocks).

  * Right Column: AI Productivity & Routine Recommendations (Cards for Burnout Risk, Deep Work Suggestions, Energy Alignment).

- Settings Drawer: Modal to enter API Keys (Rime, Qdrant, Groq, Deepgram) saved in local storage.

---

### 6. DELIVERABLES

Generate complete, modular code files for:

1. Backend streaming API routes (FastAPI or Node/TypeScript WebSockets).

2. Frontend components (Timetable Grid, Recommendation Cards, Audio Visualizer, Input Bar).

3. Audio/VAD hook and Qdrant memory utility functions.

4. Full TypeScript type definitions.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://routine-harmony-ai.lovable.app

Video: 


https://github.com/user-attachments/assets/d64fadfa-0a57-4a96-88b1-6210b64c13f3













