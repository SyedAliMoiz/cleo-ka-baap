# feature-ideas.md

Working title: **Automated Content Engine – v3**

## 1. Authentication & User Accounts

### 1.1 Auth Flow
- **JWT-based authentication**:
  - User can **sign up** with email + password (and possibly name).
  - User can **log in** with email + password.
  - Backend issues **JWT access tokens** (and optionally refresh tokens).
  - Tokens are stored securely on the frontend (no localStorage for access tokens if avoidable; consider HTTP-only cookies or secure storage strategy).

### 1.2 Basic Account Management (MVP)
- User can:
  - View basic profile (name, email).
  - Update password (via change password flow).
- (Optional / later) Password reset via email.

### 1.3 Authorization / Roles
- Two main roles:
  - **User**: Can manage their own clients and content.
  - **Admin**: Can access admin panel, manage custom instructions, knowledge files, and LLM routing.

---

## 2. Client Management

### 2.1 Purpose
- Allow users (content writers) to manage **clients** whose content they are writing for.
- Client details will be used to provide context for all content generation steps (topic, hook, research, thread, CTA, hook polishing).

### 2.2 Client Data Model (inspired by existing project)
- Reuse / adapt from:
  - `automated-content-engine-main/backend/src/clients`
- Each client may include (tentative):
  - Client name / brand name
  - Niche / industry
  - Target audience
  - Offer details (products/services)
  - Tone of voice / style preferences
  - Social platform(s) they post on (Twitter/X, LinkedIn, etc.)
  - Any other structured fields currently used in `ace-main`.

### 2.3 Client Management Features
- **Create / Update / Delete** clients.
- **List** all clients for a user.
- Associate each generated content artifact (topic, research, thread, CTA) with a specific **client**.

---

## 3. Content Generation Flow (Step-by-step)

The main user workflow is a **guided multi-step flow** that takes the user from client selection all the way to a polished hook and complete thread.

### 3.1 Step 1 – Topic Generator

**Goal**: Generate a topic for the selected client, or allow the user to define their own.

- User selects a **client** from their client list.
- App offers:
  - Option A: **AI-generated topic** based on client details.
  - Option B: **Manual topic entry** (user-defined).
- When using AI:
  - The LLM uses **client context** (niche, audience, offer, etc.) to suggest relevant topics.
  - Possibly multiple suggestions; user selects one or refines.

Output:
- **Selected topic** (final, user-confirmed).
- Stored alongside client ID and any relevant metadata.

---

### 3.2 Step 2 – Hook Draft Generator

**Goal**: Create a rough draft of a **hook** for the chosen topic.

- Uses:
  - Selected **client**.
  - Confirmed **topic** from Step 1.
- LLM generates:
  - One or multiple **hook variations** (short, attention-grabbing intros).
- User can:
  - Pick one hook.
  - Optionally edit / refine the chosen hook by hand.

Output:
- **Rough hook draft** (user-approved).
- Associated with the client and topic.

---

### 3.3 Step 3 – Research

**Goal**: Generate research material to support the topic and hook. Two modes:

#### 3.3.1 Targeted Research (Perplexity-only)

- Uses **Perplexity** as the underlying research engine.
- Uses **predefined custom instructions** stored in the database.
  - These instructions are **editable by Admin** via the admin panel.
- Behavior:
  - Sends topic + hook + client context + custom instructions to a Perplexity-backed research flow.
  - Returns **focused, concise research** tailored to that topic and hook.
- Output format:
  - Key points / bullets.
  - References/sources (if applicable).
  - Any constraints defined via instructions.

#### 3.3.2 Deep Research (Google News + Perplexity + Grok)

- A more powerful, **multi-source research mode** combining:
  - **Google News**
  - **Perplexity**
  - **Grok**
- Uses custom instructions (also editable by Admin) to:
  - Pull **comprehensive, up-to-date information**.
  - Provide deeper context, trends, and angles.
- Intended to produce:
  - A **structured, detailed research document** that can be fed into the thread writer.
  - Possibly includes summarized sections, key stats, examples, quotes, etc.

#### 3.3.3 Research Output Handling

- Both modes:
  - Store results in a structured format (e.g., sections, bullets, references).
  - Tag results with:
    - Client
    - Topic
    - Hook
    - Research mode (targeted/deep)

- After research is complete, user proceeds to the next step.

---

### 3.4 Step 4 – Thread Writer (with RAG)

**Goal**: Use all collected context to generate a complete **thread**.

Inputs:
- Client details
- Topic
- Rough hook
- Research data (from Step 3)
- **Knowledge files** via RAG

#### 3.4.1 Knowledge & RAG Integration

- Reuse and build on the existing RAG implementation from:
  - `automated-content-engine-new-ace/backend/src/rag`
- Admin can upload knowledge files (see Admin panel section).
- Thread writer will:
  - Combine **client context**, **research**, and **RAG results** to generate a high-quality thread.
  - Ensure knowledge retrieval is relevant to the specific client/topic.

#### 3.4.2 Thread Generation UI/UX

- Thread is generated as a **multi-part / multi-tweet-style** structure.
- Rendering should follow the existing pattern used in:
  - `automated-content-engine-main/frontend/app/thread-writer/page.tsx`
- User can:
  - View the thread in a “social media thread” layout.
  - Edit individual parts of the thread.
  - Regenerate specific sections if needed (optional/future).

Output:
- Final **thread** stored in a structured format:
  - Ordered list of posts/steps.
  - Associated with client, topic, hook, and research.

---

### 3.5 Step 5 – CTA Generator

**Goal**: Generate a **transition + CTA** (call to action) for the thread, customized to the client’s offer.

Inputs:
- Client details (including **offers** and goals).
- Generated **thread**.
- Any relevant custom instructions (admin-managed).

Behavior:
- LLM generates:
  - A smooth **transition** from the thread content into a CTA.
  - A **CTA** tailored to:
    - Client’s product/service.
    - Target audience.
    - Desired action (sign up / book a call / buy / follow, etc.).
- Admin-defined instructions from the database guide CTA structure and tone.

Output:
- Saved **CTA block** (transition + CTA).
- Linked to the thread and client.

---

### 3.6 Step 6 – Hook Polisher

**Goal**: Take the rough hook (and full context) and polish it into the **best possible hook**.

Inputs:
- Original **hook draft** from Step 2.
- Full context:
  - Client details
  - Topic
  - Research
  - Thread
  - CTA (optional but available)
- Custom instructions from the database for **hook polishing**.

Behavior:
- LLM refines and optimizes the hook:
  - Makes it more attention-grabbing.
  - Ensures consistency with the rest of the thread and client brand.
- User can:
  - Compare **before/after**.
  - Accept or request another variation.

Output:
- Final **polished hook** stored with the rest of the content artifacts.

---

## 4. Admin Panel

### 4.1 Custom Instructions Management

Admin can:

- **View / Edit / Create** custom instructions for each module/step:
  - Topic Generator
  - Hook Draft Generator
  - Targeted Research
  - Deep Research
  - Thread Writer
  - CTA Generator
  - Hook Polisher
- Instructions should be stored in the database and identified by:
  - Module/step
  - Possibly versioning or environment tags (future enhancement).

### 4.2 Knowledge Files Management (RAG)

Admin can:

- **Upload knowledge files** (e.g., PDFs, docs, text files) that are used for RAG.
- See a list of uploaded files.
- Remove/disable outdated files.
- Trigger re-indexing if needed.

RAG system (from `ace-new`):
- Should be integrated and extended to support:
  - Multi-client or global knowledge.
  - Tagging / scoping of knowledge (e.g., client-specific vs global).

### 4.3 LLM Model Routing / Configuration

Admin can:

- Choose which **LLM model** to use for each step/module.
- Must support at least:
  - **OpenAI** models
  - **Claude** models
- For each step (Topic, Hook, Research, Thread, CTA, Hook Polisher), admin can configure:
  - Model provider (OpenAI / Claude / etc.).
  - Specific model name.
  - Optional temperature / max tokens / other model settings (future detail).

Configuration is:
- Stored in the database.
- Loaded by the backend at runtime to route requests accordingly.
- Not hard-coded.

---

## 5. Reuse from Existing Projects

The new version must **reuse and improve** existing code/ideas from:

- `automated-content-engine-main`
  - Especially:
    - Client management: `backend/src/clients`
    - Thread rendering UI: `frontend/app/thread-writer/page.tsx`
  - General project structure & dev experience from `README.md`.

- `automated-content-engine-new-ace`
  - RAG implementation: `backend/src/rag`.

Where possible:
- Align data models between old and new.
- Avoid duplicating logic.
- Migrate or refactor existing patterns into cleaner, more modular components.

---

## 6. Roles & Permissions Summary

- **User**
  - JWT-based signup/login.
  - Manage own clients.
  - Run the full content workflow (Topic → Hook → Research → Thread → CTA → Hook Polisher).
  - View and edit their own content.

- **Admin**
  - Everything a regular user can do (optionally).
  - Plus:
    - Manage custom instructions per module.
    - Manage knowledge files for RAG.
    - Configure LLM models per step.

---
