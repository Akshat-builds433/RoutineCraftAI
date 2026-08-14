# RoutineCraft AI 🎙️⚡

> **A Production-Grade, Low-Latency Voice Engine & Cognitive Routine Optimizer for Higher Education**
OUR PROTOTYPE-https://routine-harmony-ai.lovable.app
---

## 1️⃣ Project Description

### Why We Built RoutineCraft AI
University students face severe cognitive fragmentation. Managing overlapping lecture schedules, lab hours, demanding technical coursework (such as computer programming and engineering drawing), and personal well-being often leads to chronic sleep deprivation and severe academic burnout. 

Traditional calendar applications fail because manual data entry creates high friction—when a student's daily routine shifts unexpectedly, updating static timetable blocks takes too much effort.

We built **RoutineCraft AI** to eliminate scheduling friction through a voice-first conversational assistant. A student speaks their day naturally, and the system dynamically builds an organized schedule, tracks energy alignment, and optimizes well-being in real time.

---

### Key Features & System Capabilities

* 🎙️ **Natural Voice-to-Schedule Parsing:** Converts long-form, unstructured voice descriptions into color-coded, energy-tagged calendar blocks (`High Energy`, `Medium Energy`, `Low Energy`).
* 📊 **Deep Work & Balance Index:** Real-time visual tracking of health and productivity indicators:
  * **Academic Balance Score**
  * **Rest Quality Meter**
  * **Burnout Risk Score**
* 💡 **AI Productivity Recommendations:** Contextual coaching engines that analyze schedule gaps to suggest optimal sleep targets (e.g., 7–8 hours of recovery) and Pomodoro-style rest breaks.
* 🎨 **Dynamic Theme Customization:** Instant UI theme engine with visual style variants (`Minimal`, `Energetic`, `Cozy`, `Playful`, `Nature`, `Dark Mode`).
* 💬 **Deep Work Focus Quotes:** Rotating contextual motivational quotes header tailored to keep students focused during intensive study blocks.

---

### Scientific & Technical Contributions

#### I. Clause-Based Streaming & Real-Time Voice Interruption (Barge-In)
Standard LLM voice pipelines suffer from high latency because they wait for complete text generation before starting speech synthesis. RoutineCraft AI utilizes a clause-buffer parser that extracts output in 4–6 word semantic chunks (delimited by punctuation) and streams them directly to Rime TTS, reducing response time significantly.

Simultaneously, a continuous Voice Activity Detection (VAD) audio loop monitors incoming mic levels. When the student speaks mid-response, client-side Web Audio buffers clear instantly, halting playback and setting the agent state back to `Listening`.

#### II. Dual-Modality Payload Orchestration
The LLM orchestration engine concurrently yields:
1. **Streaming Audio Feedback:** Short, natural conversational speech response for immediate voice playback.
2. **Structured JSON Payload:** Schema-validated JSON powering the interactive UI schedule grid, energy levels, balance meters, and productivity cards in real time.

#### III. Contextual Memory Retrieval
Integrated with **Qdrant Vector DB**, historical schedules, academic goals, and burnout patterns are indexed as vector embeddings. Contextual memory queries run asynchronously during prompt processing without blocking LLM token generation.

#### IV. Mathematical Burnout & Balance Scoring Engine
RoutineCraft AI calculates a real-time **Academic Balance Score** ($S_{\text{balance}} \in [1, 100]$) based on a weighted evaluation of study load, sleep duration, and rest intervals:

$$S_{\text{balance}} = w_1 \cdot C_{\text{cognitive}} + w_2 \cdot S_{\text{sleep}} + w_3 \cdot R_{\text{recovery}}$$

* **Cognitive Load ($C_{\text{cognitive}}$):** Flags uninterrupted study blocks exceeding 90 minutes and recommends 50/10 or 25/5 Pomodoro splits.
* **Sleep Window ($S_{\text{sleep}}$):** Identifies late-night study blocks occurring within critical 7–8 hour sleep recovery windows.
* **Recovery Allocation ($R_{\text{recovery}}$):** Evaluates the distribution of rest and physical exercise relative to high-intensity academic commitments.

---

## 🏗️ System Architecture & Data Flow
