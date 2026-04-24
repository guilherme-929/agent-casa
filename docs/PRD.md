# PRD: SandecoClaw

**Version:** 1.0  
**Status:** Approved  
**Author:** SandecoClaw Agent  
**Date:** 2026-03-06

---

## 1. Summary

**SandecoClaw** is a personal AI agent designed to operate 100% locally on the user's desktop. It receives commands exclusively through Telegram, processes them via a pipeline that supports multiple LLMs dynamically, and has persistent access to memory in SQLite.

---

## 2. Context & Motivation

**The Problem:**
Cloud-hosted agents and third-party services often require exposing private data or have high recurring costs. Additionally, there is a lack of full governance over custom "skills". Users often find it difficult to maintain full control over instances like OpenClaw without running into cloud complexity or vendor lock-in.

**Evidence:**
Previous attempts based on OpenClaw worked, but the primary intention now is to maintain a minimalist codebase under total user control, operating directly on the local OS.

**Why Now:**
The rise of highly efficient LLMs (Gemini 1.5/2.0+, DeepSeek, Groq) combined with the ease of the Telegram API allows for a personal agent without the operational friction of a web UI.

---

## 3. Goals

- **G-01**: Operate primarily by receiving and responding to requests via Telegram using `grammy`.
- **G-02**: Exchange "brains" (LLMs) using standardization (DeepSeek, Gemini, Groq).
- **G-03**: Retain multi-turn context with SQLite.
- **G-04**: Respect strict authorization limits via user ID (whitelist).

---

## 4. Non-Goals

- **NG-01**: No Web Interface (React/Vue/HTML). The only interface is Telegram.
- **NG-02**: No multi-user support beyond the strict whitelist. Not a SaaS.
- **NG-03**: No support for heavy databases like PostgreSQL/Mongo. Focus on local SQLite.

---

## 5. User Personas

**Primary User**: The owner, accessing via mobile or desktop Telegram client, using whitelisted IDs.

**Journey:**
The user sends a chat on Telegram, the SandecoClaw runs locally in the background, calls LLMs, reads Skills from local folders, triggers tools, and responds in the same chat organically.

---

## 6. Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-----------|-----------|-------------------|
| RF-01 | Persistent polling loop via Grammy. | Must | Bot starts with `npm run dev` and intercepts messages. |
| RF-02 | Whitelist validation. | Must | Non-whitelisted users are ignored; no sensitive logs or API calls. |
| RF-03 | Dynamic LLM switching. | Must | Switching providers (e.g., Gemini to Groq) works correctly via `ProviderFactory`. |

---

## 7. Data Model

**Entities in `./data/`**

- **Conversations**: Stores metadata about the chat thread.
- **Messages**: Stores the conversation history (role, content).

---

## 8. Security & Privacy

- **Authentication**: Exclusively based on the Telegram User ID provided in the `.env` file (`TELEGRAM_ALLOWED_USER_IDS`).
- **Authorization**: Whitelisted ID = Admin, others = rejected.
- **Data Privacy**: All conversation logs and local files stay on the host machine.
